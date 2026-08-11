// test-metier.mjs — rejoue le parcours complet en base, comme le fera l'app :
// inscription par domaine → publication d'un trajet → demande de place →
// acceptation → double confirmation → kilomètres comptés.
// usage : node scripts/test-metier.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const URL = get('SUPABASE_URL'), ANON = get('EXPO_PUBLIC_SUPABASE_ANON_KEY'), SERVICE = get('SUPABASE_SERVICE_ROLE_KEY');
const MDP = 'Test-Metier-2026!';

const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${get('SUPABASE_PROJECT_REF')}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${get('SUPABASE_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error((await r.text()).slice(0, 300));
  return r.json();
};

const admin = (p, o = {}) => fetch(`${URL}${p}`, { ...o,
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(o.headers || {}) } });

const client = (jwt) => async (fn, args = {}) => {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${fn} → HTTP ${r.status} ${t.slice(0, 160)}`);
  return t ? JSON.parse(t) : null;
};

const rest = (jwt) => (p, o = {}) => fetch(`${URL}/rest/v1${p}`, { ...o,
  headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json',
             Prefer: 'return=representation', ...(o.headers || {}) } });

const connexion = async (email) => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: MDP }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error(`connexion ${email} : ${JSON.stringify(t)}`);
  return t.access_token;
};

const etapes = [];
const etape = (nom, ok, detail) => { etapes.push({ Étape: nom, Résultat: ok ? 'OK' : 'ÉCHEC ⛔', Détail: detail }); return ok; };

// ---------------------------------------------------------------- préparation

await sql(`
  delete from profils where entreprise_id in (select id from entreprises where nom = 'TEST Métier');
  delete from entreprises where nom = 'TEST Métier';
  insert into entreprises (nom) values ('TEST Métier');
  insert into domaines_email (entreprise_id, domaine)
    select id, 'metier.klaxon' from entreprises where nom = 'TEST Métier';
`);

const nettoyerCompte = async (email) => {
  const l = await admin('/auth/v1/admin/users?page=1&per_page=200').then((r) => r.json());
  const u = (l.users || []).find((x) => x.email === email);
  if (u) await admin(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE' });
};

// ---------------------------------------------------------------- 1. inscription

await nettoyerCompte('anne@metier.klaxon');
await nettoyerCompte('bob@metier.klaxon');
await nettoyerCompte('intrus@ailleurs.klaxon');

const creer = async (email) => {
  const r = await admin('/auth/v1/admin/users', { method: 'POST',
    body: JSON.stringify({ email, password: MDP, email_confirm: true }) });
  return { status: r.status, body: await r.json() };
};

const anne = await creer('anne@metier.klaxon');
const bob = await creer('bob@metier.klaxon');
etape('Inscription avec un domaine d\'entreprise connu', !!anne.body.id && !!bob.body.id, 'profil créé automatiquement');

const intrus = await creer('intrus@ailleurs.klaxon');
etape('Inscription avec un domaine inconnu', !intrus.body.id, `refusée (HTTP ${intrus.status})`);

const profils = await sql(`
  select p.email, e.nom as entreprise from profils p join entreprises e on e.id = p.entreprise_id
  where e.nom = 'TEST Métier' order by p.email;`);
etape('Rattachement automatique à la bonne entreprise', profils.length === 2, profils.map((p) => p.email).join(', '));

await sql(`
  update profils set prenom = 'Anne', nom = 'Durand', commune_code = '94028'
    where email = 'anne@metier.klaxon';
  update profils set prenom = 'Bob', nom = 'Lemoine', commune_code = '94068'
    where email = 'bob@metier.klaxon';
`);

const jwtAnne = await connexion('anne@metier.klaxon');
const jwtBob = await connexion('bob@metier.klaxon');
const rpcAnne = client(jwtAnne), rpcBob = client(jwtBob);
const restAnne = rest(jwtAnne), restBob = rest(jwtBob);

// ---------------------------------------------------------------- 2. publication

// Le jour se demande au serveur, jamais à l'horloge du PC : c'est exactement
// l'écart entre les deux qui avait fait échouer ce test la première fois.
const isodow = (await sql('select extract(isodow from aujourdhui())::int as j;'))[0].j;

// L'app n'envoie ni l'entreprise ni l'auteur : la base les déduit du compte connecté.
// La distance envoyée est volontairement absurde, pour prouver qu'elle est recalculée.
const pub = await restAnne('/trajets', { method: 'POST',
  body: JSON.stringify({ role: 'conducteur', commune_depart: '94028', commune_arrivee: '75112',
    jours: [isodow], heure_aller: '08:00', heure_retour: '18:00', places: 3,
    distance_km: 999 }) });
const trajet = (await pub.json())[0];
etape('Publication d\'un trajet', pub.ok, 'Créteil → Paris 12e');
etape('La base renseigne elle-même l\'entreprise et l\'auteur',
      !!trajet?.entreprise_id && !!trajet?.auteur_id, 'déduits du compte connecté');
etape('La base ignore la distance envoyée par l\'app', Number(trajet?.distance_km) !== 999, `${trajet?.distance_km} km recalculés`);

const liste = await rpcBob('trajets_collegues');
etape('Bob voit le trajet de sa collègue', liste.length === 1 && liste[0].auteur === 'Anne D.',
      `« ${liste[0]?.auteur} », ${liste[0]?.places_restantes} place(s)`);

// ---------------------------------------------------------------- 3. demande et acceptation

const dem = await restBob('/participations', { method: 'POST',
  body: JSON.stringify({ trajet_id: trajet.id }) });
const participation = (await dem.json())[0];
etape('Bob demande une place', dem.ok, `statut « ${participation?.statut} »`);

const demandes = await rpcAnne('mes_demandes');
etape('Anne voit la demande', demandes.length === 1 && demandes[0].passager === 'Bob L.', `de « ${demandes[0]?.passager} »`);

const acc = await restAnne(`/participations?id=eq.${participation.id}`, { method: 'PATCH',
  body: JSON.stringify({ statut: 'acceptee' }) });
etape('Anne accepte la demande', acc.ok, 'place attribuée');

// ---------------------------------------------------------------- 4. confirmations du jour

const nb = await rpcAnne('generer_confirmations_du_jour');
etape('Génération des confirmations du jour', nb === 2, `${nb} (aller + retour)`);

const rejoue = await rpcBob('generer_confirmations_du_jour');
etape('Génération rejouable sans doublon', rejoue === 0, 'aucune ligne créée en double');

const aConfirmer = await rpcBob('mes_confirmations_du_jour');
const aller = aConfirmer.find((c) => c.sens === 'aller');
etape('Bob voit ses trajets à confirmer', aConfirmer.length === 2, `avec « ${aller?.avec} »`);

await rpcBob('confirmer', { confirmation_id: aller.id });
const apresUn = await sql(`select km_valides from confirmations where id = '${aller.id}';`);
etape('Une seule confirmation ne compte aucun kilomètre', Number(apresUn[0].km_valides) === 0, '0 km');

const valide = await rpcAnne('confirmer', { confirmation_id: aller.id });
const apresDeux = await sql(`select km_valides from confirmations where id = '${aller.id}';`);
etape('La double confirmation compte les kilomètres', valide === true && Number(apresDeux[0].km_valides) > 0,
      `${apresDeux[0].km_valides} km validés`);

const statsBob = await rpcBob('mes_stats');
etape('Le compteur de Bob est à jour', Number(statsBob[0]?.km_mois) > 0,
      `${statsBob[0]?.km_mois} km ce mois, ${statsBob[0]?.co2_kg} kg de CO2 évités`);

// ---------------------------------------------------------------- 5. suppression de compte

await rpcBob('supprimer_mon_compte');
const restant = await sql(`
  select (select count(*) from auth.users where email = 'bob@metier.klaxon')::int as compte,
         (select count(*) from profils where anonymise and entreprise_id =
            (select id from entreprises where nom = 'TEST Métier'))::int as anonymises,
         (select count(*) from confirmations where km_valides > 0 and entreprise_id =
            (select id from entreprises where nom = 'TEST Métier'))::int as km_conserves;`);
etape('Suppression du compte de Bob', restant[0].compte === 0 && restant[0].anonymises === 1,
      'compte supprimé, trajets anonymisés');
etape('Les kilomètres déjà validés restent agrégés', restant[0].km_conserves > 0,
      'historique conservé, plus rattachable à personne');

// ---------------------------------------------------------------- verdict

console.log('');
console.table(etapes);
const echecs = etapes.filter((e) => e.Résultat !== 'OK').length;

await sql(`
  delete from profils where entreprise_id in (select id from entreprises where nom = 'TEST Métier');
  delete from entreprises where nom = 'TEST Métier';`);
await nettoyerCompte('anne@metier.klaxon');

console.log(echecs === 0
  ? `\n  ✅ ${etapes.length} étapes, le parcours complet fonctionne.`
  : `\n  ⛔ ${echecs} étape(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
