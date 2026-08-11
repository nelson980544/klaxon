-- Klaxon — le jour, c'est le jour en France.
--
-- Postgres travaille en UTC : `current_date` bascule à minuit UTC, soit 1 h ou 2 h
-- du matin heure française selon la saison. Sans ça, un salarié qui ouvre l'app à
-- 00 h 30 verrait les trajets de la veille, et la fenêtre de confirmation d'hier
-- serait encore ouverte. Toute la logique « du jour » passe donc par aujourdhui().

create or replace function aujourdhui() returns date
language sql stable as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- La fenêtre de confirmation : le jour même, en heure française.
create or replace function fenetre_confirmation() returns trigger
language plpgsql as $$
begin
  if (new.confirme_conducteur is distinct from old.confirme_conducteur
      or new.confirme_passager is distinct from old.confirme_passager)
     and new.jour <> aujourdhui() then
    raise exception 'Confirmation impossible : la fenêtre du % est fermée', new.jour;
  end if;
  return new;
end $$;

create or replace function generer_confirmations_du_jour()
returns int language plpgsql security definer set search_path = public as $$
declare ent uuid; jour_iso smallint; le_jour date; cree int;
begin
  ent := mon_entreprise();
  if ent is null then return 0; end if;
  le_jour := aujourdhui();
  jour_iso := extract(isodow from le_jour)::smallint;

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
  select ent, trajet_id, conducteur, passager, le_jour, sens from lignes
  on conflict (trajet_id, passager_id, jour, sens) do nothing;

  get diagnostics cree = row_count;
  return cree;
end $$;

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
  where c.jour = aujourdhui()
    and (c.conducteur_id = auth.uid() or c.passager_id = auth.uid())
  order by 6;
$$;

create or replace function confirmer(confirmation_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare c confirmations;
begin
  select * into c from confirmations where id = confirmation_id;
  if c.id is null then raise exception 'Confirmation introuvable'; end if;
  if c.jour <> aujourdhui() then raise exception 'La fenêtre de confirmation est fermée'; end if;

  if c.conducteur_id = auth.uid() then
    update confirmations set confirme_conducteur = true where id = confirmation_id;
  elsif c.passager_id = auth.uid() then
    update confirmations set confirme_passager = true where id = confirmation_id;
  else
    raise exception 'Ce trajet ne vous concerne pas';
  end if;

  return (select km_valides > 0 from confirmations where id = confirmation_id);
end $$;

-- Les compteurs suivent le même calendrier : « ce mois-ci » commence le 1er à
-- minuit heure française, pas à 2 h du matin le 1er.
create or replace function mes_stats()
returns table (km_mois numeric, km_annee numeric, trajets_mois bigint, co2_kg numeric, montant_estime numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('month', aujourdhui())), 0),
    coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year',  aujourdhui())), 0),
    count(*)  filter (where c.jour >= date_trunc('month', aujourdhui())),
    round(coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year', aujourdhui())), 0) * e.co2_g_par_km / 1000.0, 1),
    round(coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year', aujourdhui())), 0) * e.bareme_km, 2)
  from confirmations c
  join entreprises e on e.id = c.entreprise_id
  where c.km_valides > 0
    and (c.conducteur_id = auth.uid() or c.passager_id = auth.uid())
  group by e.co2_g_par_km, e.bareme_km;
$$;

create or replace function rh_stats_mensuels(nb_mois int default 12)
returns table (
  mois date, km numeric, trajets bigint, participants_actifs bigint,
  co2_evite_kg numeric, masque boolean
)
language plpgsql stable security definer set search_path = public as $$
declare ent uuid; seuil int; co2 int;
begin
  if not est_rh() then
    raise exception 'Réservé aux comptes RH';
  end if;
  ent := mon_entreprise();
  select e.seuil_masquage, e.co2_g_par_km into seuil, co2 from entreprises e where e.id = ent;

  return query
  with base as (
    select date_trunc('month', c.jour)::date as m,
           sum(c.km_valides) as km,
           count(*) as nb,
           count(distinct p) as participants
    from confirmations c
    cross join lateral (values (c.conducteur_id), (c.passager_id)) as v(p)
    where c.entreprise_id = ent
      and c.km_valides > 0
      and c.jour >= (date_trunc('month', aujourdhui()) - make_interval(months => nb_mois - 1))::date
    group by 1
  )
  select b.m,
         case when b.participants >= seuil then b.km end,
         case when b.participants >= seuil then b.nb end,
         case when b.participants >= seuil then b.participants end,
         case when b.participants >= seuil then round(b.km * co2 / 1000.0, 1) end,
         b.participants < seuil
  from base b
  order by b.m;
end $$;
