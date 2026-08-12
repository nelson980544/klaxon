# PROGRESS — Klaxon

Journal de construction. Reprenable : chaque phase est idempotente, on peut la rejouer.

## Comptes branchés

| Service | État | Détail |
|---|---|---|
| Supabase | ✅ | projet `klaxon` · ref `lcayavdsjxdeyeuyghjb` · **Paris (eu-west-3)** |
| GitHub | ✅ | dépôt `nelson980544/klaxon` — ⚠️ **encore public**, à passer en privé |
| Expo / EAS | ✅ | compte `grandao241` |
| Vercel | ✅ | projet `klaxon` · site en ligne sur https://klaxon-five.vercel.app |
| Apple Developer | ⬜ | nécessaire pour publier (99 $/an) |

Mot de passe du back-office : `BACKOFFICE_ADMIN_PASSWORD` dans `.recette/secrets.env`.

## Phases

- [x] **Spec verrouillée** — `APP-SPEC.md`
- [x] **Base de données** — `db/0001_init.sql` → `db/0006_attestations.sql`
- [x] **Référentiel communes** — 35 014 entrées (France entière + 45 arrondissements), via `scripts/import-communes.mjs`
- [x] **Isolation multi-tenant prouvée** — `scripts/test-isolation.mjs` : 14 tentatives, 14 bloquées
- [x] **Parcours métier prouvé** — `scripts/test-metier.mjs` : 18 étapes
- [x] **App Expo** — **SDK 54** (figé : version supportée par l Expo Go du client), Expo Router, `mobile/src/`
- [x] **Écrans** — connexion, code, profil, trajets, publication, confirmation, compteur, RH, réglages
- [x] **Données de démonstration** — `scripts/seed-demo.mjs` : 2 entreprises, 13 salariés, 3 mois d'historique
- [x] **Vérifications** — `tsc --noEmit` ✅ · `expo export --platform ios` ✅ · bundle de dev servi en HTTP 200 ✅
- [x] **Testé sur appareil réel** (iPad, Expo Go, 12 août 2026) — l app se lance et fonctionne
- [x] **Icône, écran de démarrage, favicon** — `brand/icon.svg` → `tools/generer-icone.mjs`
- [x] **Landing + pages légales** — `site/` (Next.js) : accueil, confidentialité, conditions, support
- [x] **Mise en ligne du site** — https://klaxon-five.vercel.app (Vercel, déploiement automatique depuis GitHub)
- [x] **Code sur GitHub** — https://github.com/nelson980544/klaxon (public)
- [x] **Back-office web** — https://klaxon-yte1-gray.vercel.app (projet Vercel `klaxon-yte1`, dossier `backoffice/`)
- [ ] **Audit final (GATE 2a)**

## Décisions et corrections notables

1. **Fuseau horaire (correction)** — la base raisonnait en UTC : à 00 h 30 heure française, l'app
   proposait les trajets de la veille et laissait la fenêtre de confirmation d'hier ouverte.
   Toute la logique « du jour » passe désormais par `aujourdhui()` (Europe/Paris) — `db/0003_fuseau.sql`.
2. **Suppression de compte (correction)** — supprimer un compte effaçait aussi les kilomètres déjà
   agrégés de l'entreprise. Le profil anonymisé survit maintenant au compte : les données
   personnelles disparaissent, les statistiques restent — `db/0004_suppression_compte.sql`.
3. **Refus explicite (durcissement)** — une requête prétendant écrire dans une autre entreprise voyait
   sa valeur réécrite en silence. Elle est désormais rejetée franchement — `db/0005_refus_explicite.sql`.
4. **Codes INSEE (correction)** — des codes de communes écrits à la main étaient faux (Orvault portait
   le code de Rezé). Le référentiel vient maintenant uniquement de `geo.api.gouv.fr`.
5. **RH = salarié + agrégats** — un RH covoiture comme tout le monde ; son rôle n'ouvre que les
   chiffres agrégés, jamais un trajet nominatif, même dans sa propre entreprise.
6. **Bouton d'attestations** — il ne faisait rien ; il dépose maintenant une demande tracée que le
   back-office traitera — `db/0006_attestations.sql`.

## ⚠️ Dettes assumées

**Le back-office n'a pas de second facteur** — un simple mot de passe, alors qu'il ouvre les données
nominatives de toutes les entreprises clientes. Le mot de passe généré est long et unique, mais un
second facteur (TOTP) est à ajouter avant le premier vrai client.

## ⚠️ À régler avant d'ouvrir à de vrais salariés

**L'envoi des emails de connexion.** Supabase envoie les emails lui-même sur le plan gratuit, mais :
**Resend est branché** (SMTP Supabase, codes à 6 chiffres, gabarit français, 100 emails/heure) et trois
emails sont réellement arrivés. Mais faute de domaine vérifié, on expédie depuis l adresse partagée
`onboarding@resend.dev`, qui ne peut écrire qu au propriétaire du compte Resend — et qui s est tue
après quelques envois rapprochés (plafond horaire probable, non confirmé).

**Il faut donc un nom de domaine** pour ouvrir à de vrais salariés. Une fois vérifié chez Resend,
l envoi devient illimité et l adresse d expédition cohérente. **En attendant, seuls les comptes de
démonstration peuvent se connecter** — ce qui suffit pour la review Apple.

## Comptes de démonstration (pour Apple)

| Rôle | Email | Code |
|---|---|---|
| Salarié | `demo.salarie@lafabrique.demo` | `240613` |
| RH | `demo.rh@lafabrique.demo` | `240613` |

Le code fixe ne fonctionne que sur le domaine `lafabrique.demo` (voir `mobile/src/lib/demo.ts`).
Une seconde entreprise fictive, **Groupe Vernet**, existe uniquement pour prouver l'isolation :
les comptes de démonstration n'en voient aucune trace — vérifié par `scripts/test-demo.mjs`.

## Commandes utiles

```bash
node scripts/db-apply.mjs db/000X_xxx.sql   # appliquer une migration
node scripts/test-isolation.mjs             # le garde-fou : 14 tentatives d'intrusion
node scripts/test-metier.mjs                # le parcours complet
node scripts/test-demo.mjs                  # les comptes de la review Apple
node scripts/seed-demo.mjs                  # recréer les données de démonstration
node scripts/import-communes.mjs            # réimporter le référentiel des communes
```
