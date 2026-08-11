// seed-demo.mjs — les données de démonstration.
//
// Deux entreprises fictives :
//   • La Fabrique  → celle que verra le relecteur Apple, remplie sur 3 mois.
//   • Groupe Vernet → n'existe QUE pour prouver l'isolation : les comptes de démo
//     ne doivent jamais en voir la moindre trace.
//
// Les deux comptes de démonstration se connectent avec un CODE FIXE (voir CODE_DEMO),
// parce qu'un relecteur Apple ne peut pas relever un email professionnel fictif.
// Ce code ne fonctionne que sur le domaine de démonstration.
//
// Rejouable : le script efface et recrée entièrement les données de démo.
// usage : node scripts/seed-demo.mjs
import { readFileSync } from 'node:fs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const URL = get('SUPABASE_URL'), SERVICE = get('SUPABASE_SERVICE_ROLE_KEY');

import { CODE_DEMO, DOMAINE_DEMO } from './seed-demo-constantes.mjs';

const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${get('SUPABASE_PROJECT_REF')}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${get('SUPABASE_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error((await r.text()).slice(0, 400));
  return r.json();
};

const admin = (p, o = {}) => fetch(`${URL}${p}`, { ...o,
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(o.headers || {}) } });

// ---------------------------------------------------------------- table rase

console.log('  Nettoyage des données de démonstration existantes…');

const anciens = await admin('/auth/v1/admin/users?page=1&per_page=500').then((r) => r.json());
for (const u of anciens.users || []) {
  if (u.email?.endsWith('.demo')) await admin(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE' });
}

await sql(`
  delete from profils where entreprise_id in (select id from entreprises where demo);
  delete from entreprises where demo;
`);

// ---------------------------------------------------------------- entreprises

await sql(`
  insert into entreprises (nom, demo, bareme_km) values
    ('La Fabrique', true, 0.25),
    ('Groupe Vernet', true, 0.22);

  insert into domaines_email (entreprise_id, domaine)
  select id, case nom when 'La Fabrique' then '${DOMAINE_DEMO}' else 'vernet.demo' end
  from entreprises where demo;
`);

const [fabrique, vernet] = await sql(`
  select id, nom from entreprises where demo order by nom;
`).then((r) => [r.find((e) => e.nom === 'La Fabrique').id, r.find((e) => e.nom === 'Groupe Vernet').id]);

// ---------------------------------------------------------------- salariés

// Communes réelles autour de Nantes (La Fabrique) et de Lyon (Groupe Vernet).
const EQUIPE_FABRIQUE = [
  ['demo.salarie', 'Camille', 'Roussel', '44215', 'salarie'],   // Vertou — le compte de démo Apple
  ['demo.rh', 'Farid', 'Benali', '44162', 'rh'],                // Saint-Herblain — le compte RH de démo
  ['julie.marchand', 'Julie', 'Marchand', '44026', 'salarie'],  // Carquefou
  ['thomas.leroy', 'Thomas', 'Leroy', '44020', 'salarie'],      // Bouguenais
  ['sofia.ferreira', 'Sofia', 'Ferreira', '44215', 'salarie'],  // Vertou
  ['marc.dubois', 'Marc', 'Dubois', '44047', 'salarie'],        // Couëron
  ['nadia.cherif', 'Nadia', 'Chérif', '44026', 'salarie'],      // Carquefou
  ['pierre.gaillard', 'Pierre', 'Gaillard', '44020', 'salarie'],// Bouguenais
  ['laura.petit', 'Laura', 'Petit', '44162', 'salarie'],        // Saint-Herblain
  ['hugo.mercier', 'Hugo', 'Mercier', '44047', 'salarie'],      // Couëron
];

const EQUIPE_VERNET = [
  ['claire.bonnet', 'Claire', 'Bonnet', '69266', 'salarie'],    // Villeurbanne
  ['antoine.rey', 'Antoine', 'Rey', '69029', 'salarie'],        // Bron
  ['sarah.lopez', 'Sarah', 'Lopez', '69256', 'rh'],             // Vaulx-en-Velin
];

const creerSalarie = async (identifiant, domaine, motDePasse) => {
  const r = await admin('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: `${identifiant}@${domaine}`, password: motDePasse, email_confirm: true }),
  });
  const u = await r.json();
  if (!u.id) throw new Error(`${identifiant}@${domaine} : ${JSON.stringify(u).slice(0, 200)}`);
  return u.id;
};

console.log('  Création des salariés…');
const ids = {};

for (const [identifiant, prenom, nom, commune, role] of EQUIPE_FABRIQUE) {
  // Les deux comptes de démonstration reçoivent le code fixe communiqué à Apple ;
  // les autres un mot de passe aléatoire dont personne n'a besoin.
  const estDemo = identifiant.startsWith('demo.');
  const id = await creerSalarie(identifiant, DOMAINE_DEMO, estDemo ? CODE_DEMO : crypto.randomUUID());
  ids[identifiant] = id;
  await sql(`update profils set prenom = '${prenom}', nom = '${nom.replace(/'/g, "''")}',
             commune_code = '${commune}', site_travail = '44109', role = '${role}' where id = '${id}';`);
}

for (const [identifiant, prenom, nom, commune, role] of EQUIPE_VERNET) {
  const id = await creerSalarie(identifiant, 'vernet.demo', crypto.randomUUID());
  ids[identifiant] = id;
  await sql(`update profils set prenom = '${prenom}', nom = '${nom.replace(/'/g, "''")}',
             commune_code = '${commune}', site_travail = '69123', role = '${role}' where id = '${id}';`);
}

// ---------------------------------------------------------------- trajets

console.log('  Publication des trajets…');

const trajet = (ent, auteur, role, depart, arrivee, jours, aller, retour, places) =>
  `('${ent}', '${ids[auteur]}', '${role}', '${depart}', '${arrivee}', '{${jours}}', '${aller}', ${retour ? `'${retour}'` : 'null'}, ${places}, 0)`;

await sql(`
  insert into trajets (entreprise_id, auteur_id, role, commune_depart, commune_arrivee,
                       jours, heure_aller, heure_retour, places, distance_km) values
    ${trajet(fabrique, 'demo.salarie', 'conducteur', '44215', '44109', '1,2,3,4,5', '08:00', '17:45', 3)},
    ${trajet(fabrique, 'julie.marchand', 'conducteur', '44026', '44109', '1,2,3,4', '07:45', '18:00', 2)},
    ${trajet(fabrique, 'thomas.leroy', 'conducteur', '44020', '44109', '1,3,5', '08:15', '17:30', 3)},
    ${trajet(fabrique, 'marc.dubois', 'conducteur', '44047', '44109', '2,4', '08:30', '18:15', 2)},
    ${trajet(fabrique, 'demo.rh', 'passager', '44162', '44109', '1,2,3,4,5', '08:10', '17:50', 1)},
    ${trajet(fabrique, 'sofia.ferreira', 'passager', '44215', '44109', '1,2,3,4,5', '08:00', '17:45', 1)},
    ${trajet(fabrique, 'laura.petit', 'passager', '44162', '44109', '1,2,3', '08:20', '18:00', 1)},
    ${trajet(vernet, 'claire.bonnet', 'conducteur', '69266', '69123', '1,2,3,4,5', '08:00', '18:00', 3)},
    ${trajet(vernet, 'antoine.rey', 'passager', '69029', '69123', '1,2,3,4,5', '08:05', '18:05', 1)};
`);

// ---------------------------------------------------------------- participations acceptées

await sql(`
  with conducteurs as (
    select t.id, t.auteur_id, t.entreprise_id from trajets t where t.role = 'conducteur'
  )
  insert into participations (entreprise_id, trajet_id, passager_id, statut)
  select c.entreprise_id, c.id, p.passager, p.statut::klaxon_statut_participation from conducteurs c
  join (values
    ('${ids['demo.salarie']}'::uuid, '${ids['sofia.ferreira']}'::uuid, 'acceptee'),
    ('${ids['demo.salarie']}'::uuid, '${ids['demo.rh']}'::uuid,        'acceptee'),
    ('${ids['julie.marchand']}'::uuid, '${ids['nadia.cherif']}'::uuid, 'acceptee'),
    ('${ids['julie.marchand']}'::uuid, '${ids['laura.petit']}'::uuid,  'demandee'),
    ('${ids['thomas.leroy']}'::uuid, '${ids['pierre.gaillard']}'::uuid,'acceptee'),
    ('${ids['marc.dubois']}'::uuid, '${ids['hugo.mercier']}'::uuid,    'acceptee'),
    ('${ids['claire.bonnet']}'::uuid, '${ids['antoine.rey']}'::uuid,   'acceptee')
  ) as p(conducteur, passager, statut) on p.conducteur = c.auteur_id;
`);

// ---------------------------------------------------------------- historique de 3 mois

console.log('  Génération de trois mois de trajets confirmés…');

// On écrit directement les confirmations passées : le déclencheur calcule les
// kilomètres, et la fenêtre du jour même ne s'applique qu'aux modifications.
await sql(`
  insert into confirmations (entreprise_id, trajet_id, conducteur_id, passager_id, jour, sens,
                             confirme_conducteur, confirme_passager)
  select t.entreprise_id, t.id, t.auteur_id, pa.passager_id, j::date, s.sens, true, true
  from trajets t
  join participations pa on pa.trajet_id = t.id and pa.statut = 'acceptee'
  cross join generate_series(aujourdhui() - interval '3 months', aujourdhui() - interval '1 day', interval '1 day') as j
  cross join (values ('aller'::klaxon_sens), ('retour'::klaxon_sens)) as s(sens)
  where t.role = 'conducteur'
    and extract(isodow from j)::smallint = any(t.jours)
    -- une petite irrégularité : personne ne covoiture 100 % des jours
    and (extract(day from j)::int % 7) <> 0
  on conflict do nothing;
`);

// Le trajet du jour reste À CONFIRMER pour le compte de démonstration : c'est
// exactement ce que le relecteur Apple doit pouvoir tester.
await sql(`
  delete from confirmations
  where jour = aujourdhui()
    and (conducteur_id = '${ids['demo.salarie']}' or passager_id = '${ids['demo.salarie']}');
`);

// ---------------------------------------------------------------- vérification

const bilan = await sql(`
  select e.nom,
         (select count(*) from profils p where p.entreprise_id = e.id)::int as salaries,
         (select count(*) from trajets t where t.entreprise_id = e.id)::int as trajets,
         (select count(*) from confirmations c where c.entreprise_id = e.id and c.km_valides > 0)::int as confirmations,
         (select coalesce(sum(c.km_valides), 0) from confirmations c where c.entreprise_id = e.id)::int as km
  from entreprises e where e.demo order by e.nom;
`);

console.log('');
console.table(bilan);
console.log(`
  Comptes de démonstration (à communiquer à Apple) :
    Salarié : demo.salarie@${DOMAINE_DEMO}   ·  code ${CODE_DEMO}
    RH      : demo.rh@${DOMAINE_DEMO}        ·  code ${CODE_DEMO}
`);
