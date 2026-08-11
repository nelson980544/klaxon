-- Klaxon — schéma initial + isolation multi-tenant
-- Principe non négociable : l'isolation entre entreprises est appliquée par la base
-- (RLS), jamais par un filtre écrit dans l'app. L'entreprise de l'utilisateur est
-- toujours dérivée de son compte authentifié, jamais d'un paramètre envoyé par le client.

-- ---------------------------------------------------------------- types

do $$ begin
  create type klaxon_role as enum ('salarie', 'rh');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klaxon_role_trajet as enum ('conducteur', 'passager');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klaxon_statut_participation as enum ('demandee', 'acceptee', 'refusee', 'annulee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klaxon_sens as enum ('aller', 'retour');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- référentiel public

-- Communes françaises (données publiques INSEE) : aucune donnée personnelle,
-- lisible par tout utilisateur connecté, quelle que soit son entreprise.
create table if not exists communes (
  code        text primary key,             -- code INSEE
  nom         text not null,
  code_postal text not null,
  departement text not null,
  lat         double precision not null,
  lon         double precision not null
);
create index if not exists communes_nom_idx on communes (lower(nom));
create index if not exists communes_cp_idx  on communes (code_postal);

-- ---------------------------------------------------------------- tenants

create table if not exists entreprises (
  id              uuid primary key default gen_random_uuid(),
  nom             text not null,
  actif           boolean not null default true,
  seuil_masquage  int not null default 5 check (seuil_masquage >= 3),
  bareme_km       numeric(6,3) not null default 0.25,   -- € / km, indicatif forfait mobilités durables
  co2_g_par_km    int not null default 218,             -- base ADEME voiture particulière moyenne
  demo            boolean not null default false,
  cree_le         timestamptz not null default now()
);

create table if not exists domaines_email (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  domaine       text not null unique                     -- 'lafabrique.fr', en minuscules
);
create index if not exists domaines_entreprise_idx on domaines_email (entreprise_id);

-- ---------------------------------------------------------------- salariés

create table if not exists profils (
  id            uuid primary key references auth.users(id) on delete cascade,
  entreprise_id uuid not null references entreprises(id) on delete restrict,
  email         text not null,
  prenom        text,
  nom           text,
  commune_code  text references communes(code),
  site_travail  text references communes(code),
  role          klaxon_role not null default 'salarie',
  actif         boolean not null default true,
  anonymise     boolean not null default false,
  cree_le       timestamptz not null default now()
);
create index if not exists profils_entreprise_idx on profils (entreprise_id);

-- Nom d'affichage : prénom + initiale. Le nom complet ne sort jamais de la base
-- vers l'app ; il n'existe que sur l'attestation, générée côté serveur.
create or replace function nom_affichage(p profils) returns text
language sql immutable as $$
  select case when p.anonymise then 'Compte supprimé'
              else coalesce(p.prenom, 'Collègue') ||
                   case when p.nom is null or p.nom = '' then '' else ' ' || upper(left(p.nom, 1)) || '.' end
         end;
$$;

-- ---------------------------------------------------------------- trajets

create table if not exists trajets (
  id              uuid primary key default gen_random_uuid(),
  entreprise_id   uuid not null references entreprises(id) on delete cascade,
  auteur_id       uuid not null references profils(id) on delete cascade,
  role            klaxon_role_trajet not null,
  commune_depart  text not null references communes(code),
  commune_arrivee text not null references communes(code),
  jours           smallint[] not null check (array_length(jours, 1) between 1 and 7),  -- 1=lundi … 7=dimanche
  heure_aller     time not null,
  heure_retour    time,
  places          int not null default 1 check (places between 1 and 8),
  distance_km     numeric(6,1) not null,
  actif           boolean not null default true,
  cree_le         timestamptz not null default now()
);
create index if not exists trajets_entreprise_idx on trajets (entreprise_id, actif);

create table if not exists participations (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  trajet_id     uuid not null references trajets(id) on delete cascade,
  passager_id   uuid not null references profils(id) on delete cascade,
  statut        klaxon_statut_participation not null default 'demandee',
  cree_le       timestamptz not null default now(),
  unique (trajet_id, passager_id)
);
create index if not exists participations_entreprise_idx on participations (entreprise_id);

-- La double confirmation : une ligne par trajet, par jour, par sens.
-- km_valides ne devient non nul QUE si les deux confirmations sont vraies.
create table if not exists confirmations (
  id                   uuid primary key default gen_random_uuid(),
  entreprise_id        uuid not null references entreprises(id) on delete cascade,
  trajet_id            uuid not null references trajets(id) on delete cascade,
  conducteur_id        uuid not null references profils(id) on delete cascade,
  passager_id          uuid not null references profils(id) on delete cascade,
  jour                 date not null,
  sens                 klaxon_sens not null,
  confirme_conducteur  boolean not null default false,
  confirme_passager    boolean not null default false,
  km_valides           numeric(6,1) not null default 0,
  valide_le            timestamptz,
  unique (trajet_id, passager_id, jour, sens)
);
create index if not exists confirmations_entreprise_idx on confirmations (entreprise_id, jour);

-- Verrou métier : les kilomètres ne se posent pas à la main depuis l'app.
-- La base les calcule elle-même, et seulement quand les deux ont confirmé.
create or replace function maj_km_valides() returns trigger
language plpgsql as $$
declare d numeric(6,1);
begin
  if new.confirme_conducteur and new.confirme_passager then
    select distance_km into d from trajets where id = new.trajet_id;
    new.km_valides := d;
    new.valide_le  := coalesce(new.valide_le, now());
  else
    new.km_valides := 0;
    new.valide_le  := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_km_valides on confirmations;
create trigger trg_km_valides before insert or update on confirmations
  for each row execute function maj_km_valides();

-- Fenêtre de confirmation : le jour même uniquement, pas de rattrapage.
create or replace function fenetre_confirmation() returns trigger
language plpgsql as $$
begin
  if (new.confirme_conducteur is distinct from old.confirme_conducteur
      or new.confirme_passager is distinct from old.confirme_passager)
     and new.jour <> current_date then
    raise exception 'Confirmation impossible : la fenêtre du % est fermée', new.jour;
  end if;
  return new;
end $$;

drop trigger if exists trg_fenetre_confirmation on confirmations;
create trigger trg_fenetre_confirmation before update on confirmations
  for each row execute function fenetre_confirmation();

create table if not exists attestations (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  salarie_id    uuid not null references profils(id) on delete cascade,
  mois          date not null,                          -- 1er du mois
  km            numeric(8,1) not null,
  montant       numeric(8,2) not null,
  genere_le     timestamptz not null default now(),
  unique (salarie_id, mois)
);
create index if not exists attestations_entreprise_idx on attestations (entreprise_id, mois);

-- Journal des corrections faites depuis le back-office : indispensable si l'URSSAF conteste.
create table if not exists journal_corrections (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  auteur        text not null,
  cible         text not null,
  action        text not null,
  motif         text not null,
  fait_le       timestamptz not null default now()
);

-- ---------------------------------------------------------------- contexte utilisateur

-- SECURITY DEFINER : ces fonctions lisent `profils` en contournant la RLS.
-- C'est indispensable — sans ça, la policy de `profils` s'appellerait elle-même
-- et Postgres renverrait une récursion infinie.
create or replace function mon_entreprise() returns uuid
language sql stable security definer set search_path = public as $$
  select entreprise_id from profils where id = auth.uid() and actif and not anonymise;
$$;

create or replace function mon_role() returns klaxon_role
language sql stable security definer set search_path = public as $$
  select role from profils where id = auth.uid() and actif and not anonymise;
$$;

create or replace function est_rh() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mon_role() = 'rh', false);
$$;

-- ---------------------------------------------------------------- RLS

alter table entreprises          enable row level security;
alter table domaines_email       enable row level security;
alter table profils              enable row level security;
alter table trajets              enable row level security;
alter table participations       enable row level security;
alter table confirmations        enable row level security;
alter table attestations         enable row level security;
alter table journal_corrections  enable row level security;
alter table communes             enable row level security;

-- Référentiel public : lecture pour tout compte connecté, écriture réservée au back-office.
drop policy if exists communes_lecture on communes;
create policy communes_lecture on communes for select to authenticated using (true);

-- Son entreprise, et rien d'autre. En lecture seule : tout se pilote au back-office.
drop policy if exists entreprises_la_mienne on entreprises;
create policy entreprises_la_mienne on entreprises for select to authenticated
  using (id = mon_entreprise());

drop policy if exists domaines_les_miens on domaines_email;
create policy domaines_les_miens on domaines_email for select to authenticated
  using (entreprise_id = mon_entreprise());

-- Les collègues, uniquement ceux de son entreprise.
drop policy if exists profils_mes_collegues on profils;
create policy profils_mes_collegues on profils for select to authenticated
  using (entreprise_id = mon_entreprise());

-- On ne modifie que soi-même — et jamais son entreprise ni son rôle
-- (sinon n'importe qui se promeut RH et lit les chiffres de la boîte).
drop policy if exists profils_moi_meme on profils;
create policy profils_moi_meme on profils for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and entreprise_id = mon_entreprise() and role = mon_role());

-- Trajets : je vois ceux de mes collègues, je ne touche qu'aux miens.
-- Un RH n'a ici aucun privilège supplémentaire : dans l'app il est un salarié comme
-- un autre. Son rôle ne lui ouvre que les agrégats (fonctions plus bas).
drop policy if exists trajets_de_mon_entreprise on trajets;
create policy trajets_de_mon_entreprise on trajets for select to authenticated
  using (entreprise_id = mon_entreprise());

drop policy if exists trajets_les_miens_insert on trajets;
create policy trajets_les_miens_insert on trajets for insert to authenticated
  with check (auteur_id = auth.uid() and entreprise_id = mon_entreprise());

drop policy if exists trajets_les_miens_update on trajets;
create policy trajets_les_miens_update on trajets for update to authenticated
  using (auteur_id = auth.uid() and entreprise_id = mon_entreprise())
  with check (auteur_id = auth.uid() and entreprise_id = mon_entreprise());

drop policy if exists trajets_les_miens_delete on trajets;
create policy trajets_les_miens_delete on trajets for delete to authenticated
  using (auteur_id = auth.uid() and entreprise_id = mon_entreprise());

-- Participations : visibles par le passager et par le conducteur du trajet concerné.
drop policy if exists participations_visibles on participations;
create policy participations_visibles on participations for select to authenticated
  using (
    entreprise_id = mon_entreprise()
    and (passager_id = auth.uid()
         or exists (select 1 from trajets t where t.id = trajet_id and t.auteur_id = auth.uid()))
  );

drop policy if exists participations_je_demande on participations;
create policy participations_je_demande on participations for insert to authenticated
  with check (
    passager_id = auth.uid()
    and entreprise_id = mon_entreprise()
    and exists (select 1 from trajets t
                where t.id = trajet_id and t.entreprise_id = mon_entreprise() and t.actif)
  );

-- Le conducteur accepte/refuse ; le passager peut annuler la sienne.
drop policy if exists participations_maj on participations;
create policy participations_maj on participations for update to authenticated
  using (
    entreprise_id = mon_entreprise()
    and (passager_id = auth.uid()
         or exists (select 1 from trajets t where t.id = trajet_id and t.auteur_id = auth.uid()))
  )
  with check (entreprise_id = mon_entreprise());

-- Confirmations : strictement les deux personnes concernées.
drop policy if exists confirmations_les_miennes on confirmations;
create policy confirmations_les_miennes on confirmations for select to authenticated
  using (entreprise_id = mon_entreprise()
         and (conducteur_id = auth.uid() or passager_id = auth.uid()));

drop policy if exists confirmations_je_confirme on confirmations;
create policy confirmations_je_confirme on confirmations for update to authenticated
  using (entreprise_id = mon_entreprise()
         and (conducteur_id = auth.uid() or passager_id = auth.uid()))
  with check (entreprise_id = mon_entreprise());

-- Attestations : chacun voit la sienne. Le RH ne voit AUCUNE attestation nominative
-- depuis l'app — il déclenche la génération, le back-office produit les documents.
drop policy if exists attestations_les_miennes on attestations;
create policy attestations_les_miennes on attestations for select to authenticated
  using (salarie_id = auth.uid());

-- Journal des corrections et écritures de référentiel : back-office uniquement
-- (clé de service, qui ignore la RLS). Aucune policy = personne d'autre n'y touche.

-- ---------------------------------------------------------------- agrégats RH

-- Le seul canal ouvert au RH. Retourne des chiffres agrégés de SA seule entreprise,
-- avec le seuil de masquage appliqué ici, dans la base — pas dans l'app.
-- Aucun nom, aucun identifiant de trajet ne sort d'ici.
create or replace function rh_stats_mensuels(nb_mois int default 12)
returns table (
  mois                date,
  km                  numeric,
  trajets             bigint,
  participants_actifs bigint,
  co2_evite_kg        numeric,
  masque              boolean
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
      and c.jour >= (date_trunc('month', current_date) - make_interval(months => nb_mois - 1))::date
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

revoke all on function rh_stats_mensuels(int) from public;
grant execute on function rh_stats_mensuels(int) to authenticated;

-- Mes propres chiffres (onglet « Mon compteur ») — pas de seuil ici : ce sont ses données.
create or replace function mes_stats()
returns table (km_mois numeric, km_annee numeric, trajets_mois bigint, co2_kg numeric, montant_estime numeric)
language sql stable security definer set search_path = public as $$
  select
    coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('month', current_date)), 0),
    coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year',  current_date)), 0),
    count(*)  filter (where c.jour >= date_trunc('month', current_date)),
    round(coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year', current_date)), 0) * e.co2_g_par_km / 1000.0, 1),
    round(coalesce(sum(c.km_valides) filter (where c.jour >= date_trunc('year', current_date)), 0) * e.bareme_km, 2)
  from confirmations c
  join entreprises e on e.id = c.entreprise_id
  where c.km_valides > 0
    and (c.conducteur_id = auth.uid() or c.passager_id = auth.uid())
  group by e.co2_g_par_km, e.bareme_km;
$$;

revoke all on function mes_stats() from public;
grant execute on function mes_stats() to authenticated;

-- ---------------------------------------------------------------- distance

-- Distance entre deux communes : à vol d'oiseau (haversine) × coefficient routier 1,3.
-- Aucun service de cartographie externe, aucune donnée qui sort.
create or replace function distance_communes(depart text, arrivee text)
returns numeric language sql stable as $$
  select round((6371 * 2 * asin(sqrt(
      power(sin(radians(b.lat - a.lat) / 2), 2)
      + cos(radians(a.lat)) * cos(radians(b.lat)) * power(sin(radians(b.lon - a.lon) / 2), 2)
    )) * 1.3)::numeric, 1)
  from communes a, communes b
  where a.code = depart and b.code = arrivee;
$$;
