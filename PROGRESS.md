# PROGRESS — Klaxon

Journal de construction. Reprenable : chaque phase est idempotente, on peut la rejouer.

## Comptes branchés

| Service | État | Détail |
|---|---|---|
| Supabase | ✅ | projet `klaxon` · ref `lcayavdsjxdeyeuyghjb` · **Paris (eu-west-3)** |
| GitHub | ✅ | dépôt `nelson980544/klaxon` — ⚠️ **encore public**, à passer en privé |
| Expo / EAS | ✅ | compte `grandao241` |
| Vercel | ⬜ | nécessaire pour la landing et le back-office web |
| Apple Developer | ⬜ | nécessaire pour publier (99 $/an) |

## Phases

- [x] **Spec verrouillée** — `APP-SPEC.md`
- [x] **Base de données** — `db/0001_init.sql` → `db/0006_attestations.sql`
- [x] **Référentiel communes** — 35 014 entrées (France entière + 45 arrondissements), via `scripts/import-communes.mjs`
- [x] **Isolation multi-tenant prouvée** — `scripts/test-isolation.mjs` : 14 tentatives, 14 bloquées
- [x] **Parcours métier prouvé** — `scripts/test-metier.mjs` : 18 étapes
- [x] **App Expo** — SDK 57, Expo Router, `mobile/src/`
- [x] **Écrans** — connexion, code, profil, trajets, publication, confirmation, compteur, RH, réglages
- [x] **Données de démonstration** — `scripts/seed-demo.mjs` : 2 entreprises, 13 salariés, 3 mois d'historique
- [x] **Vérifications** — `tsc --noEmit` ✅ · `expo export --platform ios` ✅ · bundle de dev servi en HTTP 200 ✅
- [ ] **Test sur iPhone réel** (Expo Go) — à faire avec le client
- [x] **Icône, écran de démarrage, favicon** — `brand/icon.svg` → `tools/generer-icone.mjs`
- [x] **Landing + pages légales** — `site/` (Next.js) : accueil, confidentialité, conditions, support
- [ ] **Mise en ligne du site** — bloqué : il manque le jeton Vercel
- [ ] **Back-office web** (Next.js + Vercel)
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

## ⚠️ À régler avant d'ouvrir à de vrais salariés

**L'envoi des emails de connexion.** Supabase envoie les emails lui-même sur le plan gratuit, mais :
- impossible d'y mettre notre code à 6 chiffres (personnalisation réservée aux plans payants) ;
- le débit est plafonné à quelques emails par heure — inutilisable dès la première entreprise cliente.

Il faut donc brancher un service d'envoi d'emails (Resend, Postmark, Brevo…). C'est gratuit jusqu'à
quelques milliers d'emails par mois, et c'est ce qui rendra la connexion par code réellement
opérationnelle. **Tant que ce n'est pas fait, seuls les comptes de démonstration peuvent se connecter.**

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
