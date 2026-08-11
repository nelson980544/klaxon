// test-isolation.mjs — le garde-fou du projet.
// Crée deux entreprises et trois comptes, puis tente ACTIVEMENT de franchir la cloison
// avec de vrais jetons de connexion (comme le ferait quelqu'un de mal intentionné avec
// les identifiants publics de l'app). Chaque tentative DOIT échouer.
// usage : node scripts/test-isolation.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const URL = get('SUPABASE_URL');
const ANON = get('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE = get('SUPABASE_SERVICE_ROLE_KEY');

const admin = (path, opts = {}) =>
  fetch(`${URL}${path}`, {
    ...opts,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json',
               Prefer: 'return=representation', ...(opts.headers || {}) },
  });

const asUser = (jwt) => (path, opts = {}) =>
  fetch(`${URL}${path}`, {
    ...opts,
    headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json',
               Prefer: 'return=representation', ...(opts.headers || {}) },
  });

const sql = async (query) => {
  const token = get('SUPABASE_ACCESS_TOKEN'), ref = get('SUPABASE_PROJECT_REF');
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

// ---------------------------------------------------------------- mise en place

const MDP = 'Test-Isolation-2026!';

async function creerCompte(email) {
  // On supprime un éventuel reliquat d'un run précédent.
  const liste = await admin(`/auth/v1/admin/users?page=1&per_page=200`).then((r) => r.json());
  const existant = (liste.users || []).find((u) => u.email === email);
  if (existant) await admin(`/auth/v1/admin/users/${existant.id}`, { method: 'DELETE' });
  const r = await admin('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password: MDP, email_confirm: true }),
  });
  const u = await r.json();
  if (!u.id) throw new Error(`création compte ${email} : ${JSON.stringify(u)}`);
  return u.id;
}

async function connexion(email) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: MDP }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error(`connexion ${email} : ${JSON.stringify(t)}`);
  return t.access_token;
}

console.log('  Préparation des deux entreprises de test…');

await sql(`
  delete from profils where entreprise_id in
    (select id from entreprises where nom in ('TEST Entreprise A', 'TEST Entreprise B'));
  delete from entreprises where nom in ('TEST Entreprise A', 'TEST Entreprise B');
  insert into entreprises (nom) values ('TEST Entreprise A'), ('TEST Entreprise B');
  insert into domaines_email (entreprise_id, domaine)
    select id, case nom when 'TEST Entreprise A' then 'a.test.klaxon' else 'b.test.klaxon' end
    from entreprises where nom in ('TEST Entreprise A', 'TEST Entreprise B');
`);
const [entA, entB] = (await sql(`
  select id from entreprises where nom in ('TEST Entreprise A','TEST Entreprise B') order by nom;
`)).map((r) => r.id);

// Les profils sont créés automatiquement par le rattachement au domaine :
// on ne fait que compléter l'identité et désigner le RH.
const idSalarieA = await creerCompte('iso.salarie@a.test.klaxon');
const idRhA      = await creerCompte('iso.rh@a.test.klaxon');
const idSalarieB = await creerCompte('iso.salarie@b.test.klaxon');

await sql(`
  update profils set prenom = 'Alice', nom = 'Martin' where id = '${idSalarieA}';
  update profils set prenom = 'Rémi',  nom = 'Dubois', role = 'rh' where id = '${idRhA}';
  update profils set prenom = 'Bruno', nom = 'Petit'  where id = '${idSalarieB}';

  insert into trajets (entreprise_id, auteur_id, role, commune_depart, commune_arrivee,
                       jours, heure_aller, heure_retour, places, distance_km)
  values
    ('${entA}', '${idSalarieA}', 'conducteur', '44215', '44109', '{1,2,3,4,5}', '08:00', '17:30', 3, 0),
    ('${entB}', '${idSalarieB}', 'conducteur', '35047', '35238', '{1,2,3}',     '08:15', '18:00', 2, 0);
`);

const trajetB = (await sql(`select id from trajets where entreprise_id = '${entB}' limit 1;`))[0].id;

// Une confirmation validée côté entreprise B, pour que le RH de A ait quelque chose à convoiter.
await sql(`
  insert into confirmations (entreprise_id, trajet_id, conducteur_id, passager_id, jour, sens,
                             confirme_conducteur, confirme_passager)
  values ('${entB}', '${trajetB}', '${idSalarieB}', '${idSalarieB}', current_date, 'aller', true, true);
`);

const salarieA = asUser(await connexion('iso.salarie@a.test.klaxon'));
const rhA      = asUser(await connexion('iso.rh@a.test.klaxon'));

// ---------------------------------------------------------------- les tentatives

let echecs = 0;
const verdicts = [];

async function tenter(nom, attendu, fn) {
  let ok = false, detail = '';
  try { const r = await fn(); ok = r.ok; detail = r.detail; }
  catch (e) { ok = false; detail = e.message.slice(0, 60); }
  verdicts.push({ Tentative: nom, Attendu: attendu, Résultat: ok ? 'CONFORME' : 'FAILLE ⛔', Détail: detail });
  if (!ok) echecs++;
}

const lignes = async (rep) => { const j = await rep.json(); return Array.isArray(j) ? j : []; };

await tenter(
  'Salarié A lit les trajets de l\'entreprise B',
  '0 ligne',
  async () => {
    const l = await lignes(await salarieA(`/rest/v1/trajets?entreprise_id=eq.${entB}&select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'Salarié A lit le trajet de B par son identifiant direct',
  '0 ligne',
  async () => {
    const l = await lignes(await salarieA(`/rest/v1/trajets?id=eq.${trajetB}&select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'Salarié A liste les salariés de l\'entreprise B',
  '0 ligne',
  async () => {
    const l = await lignes(await salarieA(`/rest/v1/profils?entreprise_id=eq.${entB}&select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'Salarié A publie un trajet AU NOM de l\'entreprise B',
  'refusé par la base',
  async () => {
    const r = await salarieA('/rest/v1/trajets', {
      method: 'POST',
      body: JSON.stringify({ entreprise_id: entB, auteur_id: idSalarieA, role: 'conducteur',
        commune_depart: '44215', commune_arrivee: '44109', jours: [1], heure_aller: '08:00',
        places: 1, distance_km: 10 }),
    });
    return { ok: r.status >= 400, detail: `HTTP ${r.status}` };
  });

await tenter(
  'Salarié A publie un trajet signé d\'un autre salarié',
  'refusé par la base',
  async () => {
    const r = await salarieA('/rest/v1/trajets', {
      method: 'POST',
      body: JSON.stringify({ entreprise_id: entA, auteur_id: idRhA, role: 'conducteur',
        commune_depart: '44215', commune_arrivee: '44109', jours: [1], heure_aller: '08:00',
        places: 1, distance_km: 10 }),
    });
    return { ok: r.status >= 400, detail: `HTTP ${r.status}` };
  });

await tenter(
  'Salarié A se promeut lui-même RH',
  'refusé par la base',
  async () => {
    const r = await salarieA(`/rest/v1/profils?id=eq.${idSalarieA}`, {
      method: 'PATCH', body: JSON.stringify({ role: 'rh' }),
    });
    const l = await lignes(r);
    return { ok: r.status >= 400 || l.length === 0, detail: `HTTP ${r.status}` };
  });

await tenter(
  'Salarié A se déplace vers l\'entreprise B',
  'refusé par la base',
  async () => {
    const r = await salarieA(`/rest/v1/profils?id=eq.${idSalarieA}`, {
      method: 'PATCH', body: JSON.stringify({ entreprise_id: entB }),
    });
    const l = await lignes(r);
    return { ok: r.status >= 400 || l.length === 0, detail: `HTTP ${r.status}` };
  });

await tenter(
  'Salarié A (non RH) appelle les chiffres RH',
  'refusé par la base',
  async () => {
    const r = await salarieA('/rest/v1/rpc/rh_stats_mensuels', {
      method: 'POST', body: JSON.stringify({ nb_mois: 12 }),
    });
    return { ok: r.status >= 400, detail: `HTTP ${r.status}` };
  });

await tenter(
  'RH de A lit les trajets nominatifs de l\'entreprise B',
  '0 ligne',
  async () => {
    const l = await lignes(await rhA(`/rest/v1/trajets?entreprise_id=eq.${entB}&select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'RH de A lit les confirmations de l\'entreprise B',
  '0 ligne',
  async () => {
    const l = await lignes(await rhA(`/rest/v1/confirmations?entreprise_id=eq.${entB}&select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'RH de A lit les confirmations nominatives de SA PROPRE entreprise',
  '0 ligne (agrégats seulement)',
  async () => {
    const l = await lignes(await rhA(`/rest/v1/confirmations?select=id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'RH de A lit les attestations nominatives de ses salariés',
  '0 ligne',
  async () => {
    const l = await lignes(await rhA(`/rest/v1/attestations?select=id,salarie_id`));
    return { ok: l.length === 0, detail: `${l.length} ligne(s) reçue(s)` };
  });

await tenter(
  'RH de A obtient bien SES agrégats (contrôle positif)',
  'autorisé',
  async () => {
    const r = await rhA('/rest/v1/rpc/rh_stats_mensuels', {
      method: 'POST', body: JSON.stringify({ nb_mois: 12 }),
    });
    return { ok: r.ok, detail: `HTTP ${r.status}` };
  });

await tenter(
  'Salarié A voit bien les trajets de SES collègues (contrôle positif)',
  'autorisé',
  async () => {
    const l = await lignes(await salarieA('/rest/v1/trajets?select=id'));
    return { ok: l.length >= 1, detail: `${l.length} ligne(s) reçue(s)` };
  });

// ---------------------------------------------------------------- verdict

console.log('');
console.table(verdicts);
console.log('');

// Nettoyage : les comptes et entreprises de test ne restent jamais en base.
// Depuis la migration 0004, un profil survit à la suppression de son compte
// (c'est voulu : les agrégats restent). Il faut donc le supprimer explicitement.
for (const id of [idSalarieA, idRhA, idSalarieB]) {
  await admin(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
}
await sql(`
  delete from profils where entreprise_id in
    (select id from entreprises where nom in ('TEST Entreprise A','TEST Entreprise B'));
  delete from entreprises where nom in ('TEST Entreprise A','TEST Entreprise B');`);

if (echecs > 0) {
  console.log(`  ⛔ ${echecs} cloison(s) franchie(s). Déploiement bloqué.`);
  process.exit(1);
}
console.log(`  ✅ ${verdicts.length} tentatives, toutes bloquées. L'isolation tient.`);
