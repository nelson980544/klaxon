// import-communes.mjs — remplit le référentiel des communes depuis geo.api.gouv.fr
// (API officielle de l'État, données INSEE publiques, sans clé).
// Importe les ~34 900 communes de France + les 45 arrondissements municipaux de
// Paris, Lyon et Marseille — indispensables, sinon « Paris » est une seule case
// de 10 km de large et le rapprochement entre collègues n'a plus de sens.
//
// Rejouable sans risque : les communes existantes sont mises à jour, pas dupliquées.
// usage : node scripts/import-communes.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const TOKEN = get('SUPABASE_ACCESS_TOKEN');
const REF = get('SUPABASE_PROJECT_REF');

const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error((await r.text()).slice(0, 300));
  return r.json();
};

// Le département se lit dans le code INSEE : 2 caractères en métropole,
// 3 pour l'outre-mer (971 Guadeloupe … 976 Mayotte), et 2A/2B pour la Corse.
const departement = (code) => (code.startsWith('97') ? code.slice(0, 3) : code.slice(0, 2));

const champs = 'fields=nom,code,codesPostaux,centre&format=json';

console.log('  Téléchargement du référentiel officiel…');
const [communes, arrondissements] = await Promise.all([
  fetch(`https://geo.api.gouv.fr/communes?${champs}`).then((r) => r.json()),
  fetch(`https://geo.api.gouv.fr/communes?type=arrondissement-municipal&${champs}`).then((r) => r.json()),
]);

const lignes = [...communes, ...arrondissements]
  .filter((c) => c.centre)                    // une poignée de communes n'ont pas de centre publié
  .map((c) => ({
    code: c.code,
    nom: c.nom,
    cp: (c.codesPostaux && c.codesPostaux[0]) || '',
    dep: departement(c.code),
    lat: c.centre.coordinates[1],
    lon: c.centre.coordinates[0],
  }));

const sansCentre = communes.length + arrondissements.length - lignes.length;
console.log(`  ${lignes.length} communes et arrondissements` +
            (sansCentre ? ` (${sansCentre} ignorée(s), sans coordonnées publiées)` : ''));

const esc = (s) => String(s).replace(/'/g, "''");
const TAILLE_LOT = 1500;   // la Management API n'aime pas les requêtes géantes

for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
  const lot = lignes.slice(i, i + TAILLE_LOT);
  const valeurs = lot
    .map((c) => `('${c.code}','${esc(c.nom)}','${c.cp}','${c.dep}',${c.lat},${c.lon})`)
    .join(',');
  await sql(`
    insert into communes (code, nom, code_postal, departement, lat, lon) values ${valeurs}
    on conflict (code) do update set nom = excluded.nom, code_postal = excluded.code_postal,
      departement = excluded.departement, lat = excluded.lat, lon = excluded.lon;
  `);
  process.stdout.write(`\r  importées : ${Math.min(i + TAILLE_LOT, lignes.length)} / ${lignes.length}`);
}

const [{ total }] = await sql('select count(*)::int as total from communes;');
console.log(`\n  ✅ référentiel complet : ${total} communes en base.`);
