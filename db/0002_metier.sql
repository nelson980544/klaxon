-- Klaxon — logique métier : rattachement par domaine, confirmations du jour,
-- suppression de compte. Tout ce qui compte se passe côté base : l'app ne fait
-- qu'appeler ces fonctions, elle ne décide rien.

-- ---------------------------------------------------------------- rattachement par domaine

-- Le domaine de l'email professionnel détermine l'entreprise. Rien d'autre.
create or replace function entreprise_pour_email(adresse text)
returns uuid language sql stable security definer set search_path = public as $$
  select d.entreprise_id
  from domaines_email d
  join entreprises e on e.id = d.entreprise_id
  where d.domaine = lower(split_part(adresse, '@', 2))
    and e.actif;
$$;

-- Appelée par l'app AVANT d'envoyer le lien magique : inutile d'envoyer un email
-- à quelqu'un dont l'entreprise n'est pas cliente. Ne renvoie que le nom de
-- l'entreprise — aucune donnée interne ne fuit à un visiteur non connecté.
create or replace function verifier_domaine(adresse text)
returns table (autorise boolean, entreprise text)
language sql stable security definer set search_path = public as $$
  select (e.id is not null), e.nom
  from (select entreprise_pour_email(adresse) as id) x
  left join entreprises e on e.id = x.id;
$$;

revoke all on function verifier_domaine(text) from public;
grant execute on function verifier_domaine(text) to anon, authenticated;

-- À la création du compte Supabase, le profil se crée tout seul, rattaché à la
-- bonne entreprise. Un domaine inconnu fait échouer l'inscription : c'est
-- volontaire, c'est ce qui garantit qu'aucun compte n'existe hors entreprise.
create or replace function creer_profil_a_l_inscription()
returns trigger language plpgsql security definer set search_path = public as $$
declare ent uuid;
begin
  ent := entreprise_pour_email(new.email);
  if ent is null then
    raise exception 'Domaine non autorisé : %', split_part(new.email, '@', 2)
      using errcode = 'check_violation';
  end if;
  insert into profils (id, entreprise_id, email)
  values (new.id, ent, lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_creer_profil on auth.users;
create trigger trg_creer_profil after insert on auth.users
  for each row execute function creer_profil_a_l_inscription();

-- ---------------------------------------------------------------- trajets

-- La distance n'est jamais fournie par l'app : la base la calcule elle-même.
create or replace function calculer_distance_trajet()
returns trigger language plpgsql as $$
begin
  new.distance_km := distance_communes(new.commune_depart, new.commune_arrivee);
  if new.distance_km is null then
    raise exception 'Commune inconnue';
  end if;
  return new;
end $$;

drop trigger if exists trg_distance_trajet on trajets;
create trigger trg_distance_trajet before insert or update of commune_depart, commune_arrivee
  on trajets for each row execute function calculer_distance_trajet();

-- L'entreprise d'un trajet n'est jamais choisie par l'app non plus.
create or replace function forcer_entreprise_trajet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.entreprise_id := mon_entreprise();
  new.auteur_id := coalesce(new.auteur_id, auth.uid());
  return new;
end $$;

drop trigger if exists trg_entreprise_trajet on trajets;
create trigger trg_entreprise_trajet before insert on trajets
  for each row when (auth.uid() is not null) execute function forcer_entreprise_trajet();

drop trigger if exists trg_entreprise_participation on participations;
create or replace function forcer_entreprise_participation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.entreprise_id := mon_entreprise();
  new.passager_id := coalesce(new.passager_id, auth.uid());
  return new;
end $$;
create trigger trg_entreprise_participation before insert on participations
  for each row when (auth.uid() is not null) execute function forcer_entreprise_participation();

-- Les trajets des collègues, avec le nom d'affichage (prénom + initiale) et
-- les places restantes. C'est ce que l'app affiche — jamais la table brute.
create or replace function trajets_collegues(
  filtre_depart text default null,
  filtre_arrivee text default null,
  filtre_heure_min time default null,
  filtre_heure_max time default null
)
returns table (
  id uuid, auteur text, est_le_mien boolean, role klaxon_role_trajet,
  depart text, arrivee text, jours smallint[], heure_aller time, heure_retour time,
  places int, places_restantes int, distance_km numeric, deja_demande boolean
)
language sql stable security definer set search_path = public as $$
  select t.id,
         nom_affichage(p),
         t.auteur_id = auth.uid(),
         t.role,
         cd.nom, ca.nom,
         t.jours, t.heure_aller, t.heure_retour,
         t.places,
         t.places - coalesce((select count(*) from participations pa
                              where pa.trajet_id = t.id and pa.statut = 'acceptee'), 0)::int,
         t.distance_km,
         exists (select 1 from participations pa
                 where pa.trajet_id = t.id and pa.passager_id = auth.uid()
                   and pa.statut in ('demandee', 'acceptee'))
  from trajets t
  join profils p   on p.id = t.auteur_id
  join communes cd on cd.code = t.commune_depart
  join communes ca on ca.code = t.commune_arrivee
  where t.entreprise_id = mon_entreprise()
    and t.actif
    and (filtre_depart is null or t.commune_depart = filtre_depart)
    and (filtre_arrivee is null or t.commune_arrivee = filtre_arrivee)
    and (filtre_heure_min is null or t.heure_aller >= filtre_heure_min)
    and (filtre_heure_max is null or t.heure_aller <= filtre_heure_max)
  order by (t.auteur_id = auth.uid()) desc, t.heure_aller;
$$;

revoke all on function trajets_collegues(text, text, time, time) from public;
grant execute on function trajets_collegues(text, text, time, time) to authenticated;

-- Les demandes de place reçues sur mes trajets (côté conducteur).
create or replace function mes_demandes()
returns table (id uuid, trajet_id uuid, passager text, depart text, arrivee text,
               heure_aller time, statut klaxon_statut_participation)
language sql stable security definer set search_path = public as $$
  select pa.id, t.id, nom_affichage(p), cd.nom, ca.nom, t.heure_aller, pa.statut
  from participations pa
  join trajets t   on t.id = pa.trajet_id
  join profils p   on p.id = pa.passager_id
  join communes cd on cd.code = t.commune_depart
  join communes ca on ca.code = t.commune_arrivee
  where t.auteur_id = auth.uid()
    and pa.statut = 'demandee'
    and t.entreprise_id = mon_entreprise()
  order by pa.cree_le;
$$;

revoke all on function mes_demandes() from public;
grant execute on function mes_demandes() to authenticated;

-- ---------------------------------------------------------------- confirmations du jour

-- Crée les lignes de confirmation du jour pour l'entreprise de l'appelant.
-- Idempotente : on peut l'appeler à chaque ouverture de l'app sans rien dupliquer.
create or replace function generer_confirmations_du_jour()
returns int language plpgsql security definer set search_path = public as $$
declare ent uuid; jour_iso smallint; cree int;
begin
  ent := mon_entreprise();
  if ent is null then return 0; end if;
  jour_iso := extract(isodow from current_date)::smallint;

  with paires as (
    select t.id as trajet_id,
           case when t.role = 'conducteur' then t.auteur_id else pa.passager_id end as conducteur,
           case when t.role = 'conducteur' then pa.passager_id else t.auteur_id end as passager,
           t.heure_retour
    from trajets t
    join participations pa on pa.trajet_id = t.id and pa.statut = 'acceptee'
    where t.entreprise_id = ent and t.actif and jour_iso = any(t.jours)
  ),
  lignes as (
    select trajet_id, conducteur, passager, 'aller'::klaxon_sens as sens from paires
    union all
    select trajet_id, conducteur, passager, 'retour'::klaxon_sens from paires where heure_retour is not null
  )
  insert into confirmations (entreprise_id, trajet_id, conducteur_id, passager_id, jour, sens)
  select ent, trajet_id, conducteur, passager, current_date, sens from lignes
  on conflict (trajet_id, passager_id, jour, sens) do nothing;

  get diagnostics cree = row_count;
  return cree;
end $$;

revoke all on function generer_confirmations_du_jour() from public;
grant execute on function generer_confirmations_du_jour() to authenticated;

-- Ce que l'app affiche sur l'écran « à confirmer aujourd'hui ».
create or replace function mes_confirmations_du_jour()
returns table (id uuid, sens klaxon_sens, avec text, depart text, arrivee text,
               heure time, distance_km numeric, je_suis_conducteur boolean,
               j_ai_confirme boolean, l_autre_a_confirme boolean, valide boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.sens,
         nom_affichage(case when c.conducteur_id = auth.uid() then pp else pc end),
         cd.nom, ca.nom,
         case when c.sens = 'aller' then t.heure_aller else t.heure_retour end,
         t.distance_km,
         c.conducteur_id = auth.uid(),
         case when c.conducteur_id = auth.uid() then c.confirme_conducteur else c.confirme_passager end,
         case when c.conducteur_id = auth.uid() then c.confirme_passager else c.confirme_conducteur end,
         c.km_valides > 0
  from confirmations c
  join trajets t   on t.id = c.trajet_id
  join profils pc  on pc.id = c.conducteur_id
  join profils pp  on pp.id = c.passager_id
  join communes cd on cd.code = t.commune_depart
  join communes ca on ca.code = t.commune_arrivee
  where c.jour = current_date
    and (c.conducteur_id = auth.uid() or c.passager_id = auth.uid())
  order by 6;
$$;

revoke all on function mes_confirmations_du_jour() from public;
grant execute on function mes_confirmations_du_jour() to authenticated;

-- Le deuxième appui. L'app ne dit pas QUI confirme : la base le déduit du compte
-- connecté. Impossible de confirmer à la place de l'autre.
create or replace function confirmer(confirmation_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare c confirmations;
begin
  select * into c from confirmations where id = confirmation_id;
  if c.id is null then raise exception 'Confirmation introuvable'; end if;
  if c.jour <> current_date then raise exception 'La fenêtre de confirmation est fermée'; end if;

  if c.conducteur_id = auth.uid() then
    update confirmations set confirme_conducteur = true where id = confirmation_id;
  elsif c.passager_id = auth.uid() then
    update confirmations set confirme_passager = true where id = confirmation_id;
  else
    raise exception 'Ce trajet ne vous concerne pas';
  end if;

  return (select km_valides > 0 from confirmations where id = confirmation_id);
end $$;

revoke all on function confirmer(uuid) from public;
grant execute on function confirmer(uuid) to authenticated;

-- ---------------------------------------------------------------- suppression de compte

-- Exigée par Apple et par le RGPD. Anonymise les trajets passés (les kilomètres
-- déjà agrégés restent, mais ne remontent plus à personne) puis supprime le compte.
create or replace function supprimer_mon_compte()
returns void language plpgsql security definer set search_path = public as $$
declare moi uuid;
begin
  moi := auth.uid();
  if moi is null then raise exception 'Non connecté'; end if;

  update trajets set actif = false where auteur_id = moi;
  update participations set statut = 'annulee' where passager_id = moi and statut = 'demandee';
  update profils
     set prenom = null, nom = null, email = 'supprime+' || moi || '@klaxon.invalid',
         commune_code = null, site_travail = null, actif = false, anonymise = true
   where id = moi;

  delete from auth.users where id = moi;
end $$;

revoke all on function supprimer_mon_compte() from public;
grant execute on function supprimer_mon_compte() to authenticated;

-- ---------------------------------------------------------------- mon profil

create or replace function mon_profil()
returns table (id uuid, email text, prenom text, nom text, commune_code text,
               site_travail text, role klaxon_role, entreprise text, profil_complet boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.prenom, p.nom, p.commune_code, p.site_travail, p.role, e.nom,
         (p.prenom is not null and p.nom is not null and p.commune_code is not null)
  from profils p join entreprises e on e.id = p.entreprise_id
  where p.id = auth.uid();
$$;

revoke all on function mon_profil() from public;
grant execute on function mon_profil() to authenticated;

-- Petite normalisation maison : « Créteil » doit se trouver en tapant « creteil ».
create or replace function unaccent_simple(t text)
returns text language sql immutable as $$
  select lower(translate(t,
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'));
$$;

-- Recherche de commune pour les listes déroulantes de l'app.
create or replace function chercher_commune(recherche text)
returns table (code text, nom text, code_postal text, departement text)
language sql stable as $$
  select c.code, c.nom, c.code_postal, c.departement
  from communes c
  where unaccent_simple(c.nom) ilike unaccent_simple(recherche) || '%'
     or c.code_postal like recherche || '%'
  order by length(c.nom), c.nom
  limit 20;
$$;

revoke all on function chercher_commune(text) from public;
grant execute on function chercher_commune(text) to authenticated;
