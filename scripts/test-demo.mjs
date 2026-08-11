// test-demo.mjs — rejoue ce que fera le relecteur Apple avec les deux comptes
// de démonstration : se connecter avec le code fixe, voir ses trajets, confirmer,
// et — pour le RH — consulter des chiffres agrégés. Vérifie aussi qu'aucun des
// deux ne voit la moindre trace de la seconde entreprise fictive.
// usage : node scripts/test-demo.mjs
import { readFileSync } from 'node:fs';
import { CODE_DEMO, DOMAINE_DEMO } from './seed-demo-constantes.mjs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const base = get('SUPABASE_URL'), anon = get('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const connexion = async (email) => {
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: CODE_DEMO }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`${email} : ${JSON.stringify(j).slice(0, 160)}`);
  return j.access_token;
};

const client = (jwt) => async (fn, args = {}) => {
  const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${fn} → HTTP ${r.status}`);
  return t ? JSON.parse(t) : null;
};

const lignes = [];
const controle = (nom, resultat) => lignes.push({ Contrôle: nom, Résultat: resultat });

// ---------------------------------------------------------------- le salarié

const salarie = client(await connexion(`demo.salarie@${DOMAINE_DEMO}`));
const profil = (await salarie('mon_profil'))[0];
controle('Connexion du salarié avec le code fixe', `${profil.prenom} ${profil.nom} · ${profil.entreprise}`);

const trajets = await salarie('trajets_collegues');
controle('Trajets visibles', `${trajets.length} — ${trajets.map((t) => t.auteur).join(', ')}`);

await salarie('generer_confirmations_du_jour');
const aConfirmer = await salarie('mes_confirmations_du_jour');
controle('À confirmer aujourd\'hui',
  aConfirmer.length
    ? `${aConfirmer.length} · ${aConfirmer[0].depart} → ${aConfirmer[0].arrivee} avec ${aConfirmer[0].avec}`
    : 'aucun (pas de trajet prévu ce jour de la semaine)');

const stats = (await salarie('mes_stats'))[0];
controle('Compteur personnel',
  `${stats.km_annee} km cette année · ${stats.co2_kg} kg de CO₂ · ${stats.montant_estime} €`);

let refuse = false;
try { await salarie('rh_stats_mensuels', { nb_mois: 12 }); } catch { refuse = true; }
controle('Le salarié tente d\'ouvrir les chiffres RH', refuse ? 'refusé par la base' : '⛔ AUTORISÉ');

// ---------------------------------------------------------------- le RH

const rh = client(await connexion(`demo.rh@${DOMAINE_DEMO}`));
const profilRh = (await rh('mon_profil'))[0];
controle('Connexion du RH avec le code fixe', `${profilRh.prenom} ${profilRh.nom} · rôle ${profilRh.role}`);

const mensuel = await rh('rh_stats_mensuels', { nb_mois: 12 });
const visibles = mensuel.filter((m) => !m.masque);
controle('Chiffres RH agrégés',
  `${mensuel.length} mois · ${visibles.length} au-dessus du seuil · ` +
  (visibles[0] ? `${visibles[0].km} km, ${visibles[0].participants_actifs} participants` : ''));

const sesTrajets = await rh('trajets_collegues');
controle('Le RH covoiture comme tout le monde', `${sesTrajets.length} trajets visibles, comme un collègue`);

// ---------------------------------------------------------------- l'isolation, vue de la démo

const fuite = trajets.concat(sesTrajets).filter((t) =>
  ['Villeurbanne', 'Bron', 'Vaulx-en-Velin', 'Lyon'].includes(t.depart) ||
  ['Villeurbanne', 'Bron', 'Vaulx-en-Velin', 'Lyon'].includes(t.arrivee));
controle('Trace de la seconde entreprise (Groupe Vernet)',
  fuite.length === 0 ? 'aucune, comme prévu' : `⛔ ${fuite.length} trajet(s) visible(s)`);

console.log('');
console.table(lignes);
const problemes = lignes.filter((l) => String(l.Résultat).includes('⛔')).length;
console.log(problemes === 0
  ? '\n  ✅ Les deux comptes de démonstration sont prêts pour la review Apple.'
  : `\n  ⛔ ${problemes} problème(s).`);
process.exit(problemes === 0 ? 0 : 1);
