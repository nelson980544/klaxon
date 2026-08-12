-- Klaxon — ce que le back-office a besoin de manipuler : le calcul réel des
-- attestations, l'abonnement des entreprises et leurs factures.
--
-- Aucune de ces surfaces n'est ouverte à l'app : toutes ces fonctions et tables
-- sont sans politique RLS permissive, donc accessibles uniquement avec la clé de
-- service, qui ne vit que dans le back-office. Un salarié ou un RH connecté ne
-- peut rien y lire, même en tentant l'appel directement.

-- ---------------------------------------------------------------- abonnement

alter table entreprises add column if not exists prix_mensuel numeric(8,2) not null default 0;
alter table entreprises add column if not exists statut_abonnement text not null default 'essai'
  check (statut_abonnement in ('essai', 'actif', 'suspendu', 'resilie'));
alter table entreprises add column if not exists debut_abonnement date;
alter table entreprises add column if not exists contact_email text;

create table if not exists factures (
  id              uuid primary key default gen_random_uuid(),
  entreprise_id   uuid not null references entreprises(id) on delete cascade,
  numero          text not null unique,
  periode         date not null,                       -- 1er du mois facturé
  salaries_actifs int not null,
  montant_ht      numeric(10,2) not null,
  statut          text not null default 'emise' check (statut in ('emise', 'payee', 'annulee')),
  emise_le        timestamptz not null default now(),
  payee_le        timestamptz,
  unique (entreprise_id, periode)
);

alter table factures enable row level security;
-- Aucune policy : réservé à la clé de service (back-office).

-- ---------------------------------------------------------------- attestations

-- Le calcul réel. Un salarié compte ses kilomètres qu'il ait été conducteur ou
-- passager : les deux ouvrent droit au forfait mobilités durables.
create or replace function generer_attestations(ent uuid, mois_cible date)
returns int language plpgsql security definer set search_path = public as $$
declare debut date; fin date; bareme numeric; nb int;
begin
  debut := date_trunc('month', mois_cible)::date;
  fin   := (debut + interval '1 month')::date;
  select bareme_km into bareme from entreprises where id = ent;
  if bareme is null then raise exception 'Entreprise inconnue'; end if;

  insert into attestations (entreprise_id, salarie_id, mois, km, montant)
  select ent, v.p, debut, sum(c.km_valides), round(sum(c.km_valides) * bareme, 2)
  from confirmations c
  cross join lateral (values (c.conducteur_id), (c.passager_id)) as v(p)
  join profils pr on pr.id = v.p
  where c.entreprise_id = ent
    and c.km_valides > 0
    and c.jour >= debut and c.jour < fin
    and not pr.anonymise            -- un compte supprimé n'a plus d'attestation nominative
  group by v.p
  on conflict (salarie_id, mois) do update
    set km = excluded.km, montant = excluded.montant, genere_le = now();

  get diagnostics nb = row_count;

  update demandes_attestations
     set statut = 'traitee', traite_le = now()
   where entreprise_id = ent and mois = debut and statut = 'en_attente';

  return nb;
end $$;

-- Le contenu nominatif d'un lot d'attestations, pour l'export du back-office.
create or replace function attestations_du_mois(ent uuid, mois_cible date)
returns table (prenom text, nom text, email text, km numeric, montant numeric)
language sql stable security definer set search_path = public as $$
  select p.prenom, p.nom, p.email, a.km, a.montant
  from attestations a join profils p on p.id = a.salarie_id
  where a.entreprise_id = ent and a.mois = date_trunc('month', mois_cible)::date
  order by p.nom, p.prenom;
$$;

-- ---------------------------------------------------------------- corrections

-- Annuler une confirmation erronée ou frauduleuse. Toujours tracée : c'est cette
-- trace qui tient devant l'URSSAF si un forfait versé est contesté.
create or replace function corriger_confirmation(confirmation_id uuid, auteur text, motif text)
returns void language plpgsql security definer set search_path = public as $$
declare c confirmations;
begin
  select * into c from confirmations where id = confirmation_id;
  if c.id is null then raise exception 'Confirmation introuvable'; end if;

  update confirmations
     set confirme_conducteur = false, confirme_passager = false
   where id = confirmation_id;

  insert into journal_corrections (entreprise_id, auteur, cible, action, motif)
  values (c.entreprise_id, auteur, 'confirmation ' || confirmation_id,
          'annulation (' || c.km_valides || ' km retirés du ' || c.jour || ')', motif);
end $$;

-- ---------------------------------------------------------------- facturation

-- Un salarié est « actif » sur un mois s'il a au moins un trajet confirmé.
-- C'est l'assiette de facturation : on ne facture pas les comptes dormants.
create or replace function salaries_actifs(ent uuid, mois_cible date)
returns int language sql stable security definer set search_path = public as $$
  select count(distinct v.p)::int
  from confirmations c
  cross join lateral (values (c.conducteur_id), (c.passager_id)) as v(p)
  where c.entreprise_id = ent
    and c.km_valides > 0
    and c.jour >= date_trunc('month', mois_cible)::date
    and c.jour <  (date_trunc('month', mois_cible) + interval '1 month')::date;
$$;

create or replace function emettre_facture(ent uuid, periode_cible date)
returns uuid language plpgsql security definer set search_path = public as $$
declare debut date; actifs int; prix numeric; id_facture uuid; num text;
begin
  debut := date_trunc('month', periode_cible)::date;
  select prix_mensuel into prix from entreprises where id = ent;
  if prix is null then raise exception 'Entreprise inconnue'; end if;

  actifs := salaries_actifs(ent, debut);
  num := 'KLX-' || to_char(debut, 'YYYYMM') || '-' || upper(substr(ent::text, 1, 6));

  insert into factures (entreprise_id, numero, periode, salaries_actifs, montant_ht)
  values (ent, num, debut, actifs, round(actifs * prix, 2))
  on conflict (entreprise_id, periode) do update
    set salaries_actifs = excluded.salaries_actifs, montant_ht = excluded.montant_ht
  returning id into id_facture;

  return id_facture;
end $$;
