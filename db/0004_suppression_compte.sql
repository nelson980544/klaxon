-- Klaxon — la suppression de compte ne doit pas effacer l'historique agrégé.
--
-- Le profil était lié au compte Supabase par une clé « en cascade » : supprimer le
-- compte supprimait le profil, donc les confirmations, donc les kilomètres déjà
-- comptabilisés pour l'entreprise. C'est contraire à ce qu'on a promis : le RGPD
-- impose d'effacer les données personnelles, pas les statistiques agrégées d'un
-- employeur, qui n'identifient plus personne une fois le profil anonymisé.
--
-- On coupe donc le lien : le profil anonymisé survit au compte, comme une coquille
-- vide qui ne porte plus ni nom, ni email, ni commune.

alter table profils drop constraint if exists profils_id_fkey;

-- Le profil n'est plus rattaché à auth.users, donc la création à l'inscription doit
-- rester la seule porte d'entrée : personne ne doit pouvoir insérer un profil
-- à la main depuis l'app (aucune policy INSERT n'existe sur profils — on le
-- vérifie explicitement dans les tests d'isolation).

comment on table profils is
  'Profil salarié. Volontairement NON contraint à auth.users : un compte supprimé
   laisse derrière lui un profil anonymisé (prenom/nom/email/commune vidés,
   anonymise = true) pour que les kilomètres déjà validés restent comptés dans les
   agrégats de l''entreprise sans identifier qui que ce soit.';
