-- Klaxon — refuser franchement plutôt que corriger en silence.
--
-- Jusqu'ici, une requête qui prétendait écrire dans une AUTRE entreprise voyait sa
-- valeur discrètement remplacée par la bonne : la donnée restait saine, mais la base
-- répondait « créé » à une tentative d'intrusion. On préfère un refus explicite —
-- c'est plus honnête, ça se voit dans les journaux, et ça révèle immédiatement un
-- bug côté app au lieu de le masquer.
--
-- Le contrat reste simple pour l'app : elle n'envoie NI l'entreprise, NI l'auteur.
-- La base les déduit du compte connecté. Si elle les envoie quand même, ils doivent
-- correspondre — sinon c'est une erreur.

create or replace function forcer_entreprise_trajet()
returns trigger language plpgsql security definer set search_path = public as $$
declare ent uuid;
begin
  ent := mon_entreprise();
  if ent is null then
    raise exception 'Aucune entreprise rattachée à ce compte' using errcode = '42501';
  end if;
  if new.entreprise_id is not null and new.entreprise_id <> ent then
    raise exception 'Entreprise imposée par le serveur' using errcode = '42501';
  end if;
  if new.auteur_id is not null and new.auteur_id <> auth.uid() then
    raise exception 'On ne publie que ses propres trajets' using errcode = '42501';
  end if;
  new.entreprise_id := ent;
  new.auteur_id := auth.uid();
  return new;
end $$;

create or replace function forcer_entreprise_participation()
returns trigger language plpgsql security definer set search_path = public as $$
declare ent uuid;
begin
  ent := mon_entreprise();
  if ent is null then
    raise exception 'Aucune entreprise rattachée à ce compte' using errcode = '42501';
  end if;
  if new.entreprise_id is not null and new.entreprise_id <> ent then
    raise exception 'Entreprise imposée par le serveur' using errcode = '42501';
  end if;
  if new.passager_id is not null and new.passager_id <> auth.uid() then
    raise exception 'On ne demande une place que pour soi' using errcode = '42501';
  end if;
  new.entreprise_id := ent;
  new.passager_id := auth.uid();
  return new;
end $$;
