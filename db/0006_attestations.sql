-- Klaxon — le RH déclenche, le back-office produit.
--
-- Le bouton « générer les attestations » doit faire quelque chose de réel : il
-- dépose une demande datée et tracée, que l'éditeur traite depuis le back-office.
-- Le RH ne voit jamais le contenu nominatif des attestations depuis l'app.

create table if not exists demandes_attestations (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  demandeur_id  uuid not null references profils(id) on delete cascade,
  mois          date not null,
  statut        text not null default 'en_attente'
                check (statut in ('en_attente', 'traitee', 'annulee')),
  demande_le    timestamptz not null default now(),
  traite_le     timestamptz,
  unique (entreprise_id, mois)
);

alter table demandes_attestations enable row level security;

-- Le RH voit l'état de ses propres demandes — une date et un statut, rien de nominatif.
drop policy if exists demandes_attestations_rh on demandes_attestations;
create policy demandes_attestations_rh on demandes_attestations for select to authenticated
  using (entreprise_id = mon_entreprise() and est_rh());

-- Le mois demandé est toujours un mois révolu : on ne génère pas d'attestation
-- pour un mois en cours, les trajets ne sont pas tous confirmés.
create or replace function demander_attestations(mois_demande date default null)
returns date language plpgsql security definer set search_path = public as $$
declare ent uuid; cible date;
begin
  if not est_rh() then
    raise exception 'Réservé aux comptes RH';
  end if;
  ent := mon_entreprise();
  cible := date_trunc('month', coalesce(mois_demande, aujourdhui() - interval '1 month'))::date;

  if cible >= date_trunc('month', aujourdhui())::date then
    raise exception 'Le mois demandé n''est pas terminé';
  end if;

  insert into demandes_attestations (entreprise_id, demandeur_id, mois)
  values (ent, auth.uid(), cible)
  on conflict (entreprise_id, mois) do nothing;

  return cible;
end $$;

revoke all on function demander_attestations(date) from public;
grant execute on function demander_attestations(date) to authenticated;

-- L'état des demandes, pour que l'app affiche « déjà demandé » plutôt que de
-- laisser le RH cliquer dans le vide.
create or replace function mes_demandes_attestations()
returns table (mois date, statut text, demande_le timestamptz)
language sql stable security definer set search_path = public as $$
  select d.mois, d.statut, d.demande_le
  from demandes_attestations d
  where d.entreprise_id = mon_entreprise() and est_rh()
  order by d.mois desc
  limit 12;
$$;

revoke all on function mes_demandes_attestations() from public;
grant execute on function mes_demandes_attestations() to authenticated;
