# APP-SPEC — Klaxon

Punchline : **Le covoiturage entre collègues, en deux appuis.**

Public : salariés d'entreprises françaises (PME et ETI, 30 à 2000 personnes) qui font un trajet domicile-travail en voiture, seuls, sur un axe que d'autres collègues empruntent déjà. Plus les DRH / responsables RSE de ces entreprises, qui doivent prouver des kilomètres covoiturés pour verser le forfait mobilités durables et alimenter leur bilan carbone. FR uniquement en v1.

Problème résolu : les plateformes de covoiturage grand public ne marchent pas pour le domicile-travail en entreprise — on ne monte pas avec un inconnu à 7h du matin, et surtout l'employeur n'a aucune preuve exploitable des trajets pour verser le forfait mobilités durables (jusqu'à 900 €/an/salarié, exonéré de charges). Klaxon ferme le cercle à l'entreprise : on ne voit que ses collègues, et chaque trajet confirmé le jour même produit une donnée de kilométrage opposable.

Le moment magique : **le matin, une notification, deux appuis, c'est confirmé** — et le compteur de kilomètres du salarié monte. Rien à saisir, rien à calculer, rien à payer.

---

## Features v1 (dans le build)

1. **Inscription par email professionnel** — le salarié saisit son email pro. Le **domaine détermine l'entreprise** (`@lafabrique.fr` → La Fabrique). Un domaine inconnu est refusé proprement, avec un message clair (« Votre entreprise n'utilise pas encore Klaxon »).
2. **Connexion par lien magique** — pas de mot de passe. Un email arrive, on clique, on est connecté. Le lien vaut aussi vérification que l'email pro est bien le sien : c'est ce qui rend le rattachement à l'entreprise fiable.
3. **Publier un trajet récurrent** — commune de départ, commune d'arrivée, jours de la semaine, horaire aller, horaire retour, nombre de places. En conducteur (j'offre des places) ou en passager (je cherche une place).
4. **Voir les trajets de ses collègues** — liste filtrée par commune et créneau horaire, jamais une carte. Uniquement les collègues de la même entreprise. Chaque collègue apparaît en **prénom + initiale** (« Marc D. »).
5. **Se positionner sur un trajet** — un appui pour demander une place, le conducteur accepte ou refuse. Une fois accepté, le trajet devient récurrent pour les deux.
6. **La confirmation du jour même, en deux appuis** — le matin (et le soir pour le retour), notification aux deux personnes. Un appui ouvre, un appui confirme. **La double confirmation, conducteur ET passager, est la seule chose qui compte les kilomètres.** Une confirmation unilatérale ne compte rien. Fenêtre de confirmation : le jour même uniquement, jusqu'à minuit ; passé ce délai le trajet est perdu, sans rattrapage.
7. **Mon compteur** — kilomètres covoiturés du mois et de l'année, nombre de trajets, CO₂ évité, montant indicatif du forfait mobilités durables. Le salarié voit ses propres chiffres, et rien de ceux des autres.
8. **Onglet RH (visible uniquement pour le rôle RH)** — chiffres **agrégés** de sa seule entreprise : kilomètres covoiturés, nombre de trajets, participants actifs, CO₂ évité, évolution mois par mois. **Jamais un trajet identifiable, jamais un nom.** Sous **5 participants actifs**, le chiffre est remplacé par « données insuffisantes » (seuil de masquage, voir Conformité RGPD).
9. **Génération des attestations mensuelles** (déclenchée par le RH) — le RH lance la génération pour un mois donné ; le back-office produit les attestations de forfait mobilités durables. C'est le **seul** endroit où des noms apparaissent, et il est hors de l'app mobile : le RH reçoit un lien de téléchargement, l'app ne lui affiche jamais de liste nominative.
10. **Suppression de compte depuis l'app** — obligatoire côté Apple, et attendue côté RGPD. Supprime le compte et anonymise les trajets passés (les kilomètres agrégés déjà comptabilisés restent, sans rattachement à la personne).
11. **Back-office web (Next.js), réservé à l'éditeur** — voir section dédiée plus bas.

## Repoussé (pas dans la v1)

- **Carte interactive et itinéraires** — décision assumée : le rapprochement se fait par commune et créneau. Une carte imposerait une brique native lourde pour un gain nul sur un trajet domicile-travail qu'on connaît par cœur.
- **Paiement, partage de frais, cagnotte** — aucun paiement dans l'app, ni entre salariés, ni vers l'éditeur. La facturation de l'entreprise se fait hors app, dans le back-office.
- **Messagerie libre entre collègues** — écarté volontairement de la v1 : du texte libre entre utilisateurs déclencherait toute l'obligation de modération d'Apple (signaler, bloquer, filtrer). En v1 on s'en tient à des actions cadrées (demander / accepter / refuser / confirmer / annuler), sans champ de saisie libre.
- **Trajets ponctuels / exceptionnels** — v1 = récurrence hebdomadaire uniquement.
- **Covoiturage inter-entreprises** (zones d'activité, groupements d'employeurs) — c'est la v2 évidente, mais elle casse le modèle d'isolation stricte qui est le cœur de la v1.
- **Android** et **anglais** — après la v1.
- **Support iPad** — v1 déclarée iPhone uniquement (`supportsTablet: false`). L'usage est matinal et téléphone. Conséquence : les captures d'écran App Store devront être prises sur un iPhone.

---

## Écrans (app iPhone)

- **Bienvenue / inscription** — saisie de l'email pro, explication en une phrase de pourquoi l'email pro, envoi du lien magique.
- **Attente du lien magique** — écran d'attente clair, bouton « renvoyer l'email ».
- **Profil initial** (première connexion) — prénom, nom, commune de résidence, site de travail. Une seule fois.
- **Trajets** (onglet 1, écran principal) — les trajets des collègues, filtrables par commune et créneau ; mes trajets en tête ; bouton « Publier un trajet ».
- **Publier / modifier un trajet** — formulaire : rôle (conducteur/passager), commune départ, commune arrivée, jours, horaire aller, horaire retour, places.
- **Détail d'un trajet** — le collègue (prénom + initiale), les communes, les jours et horaires, places restantes, bouton « Demander une place » ou, pour le conducteur, la liste des demandes à accepter/refuser.
- **Confirmation du jour** — écran plein, déclenché par la notification : le trajet du jour, un bouton « Confirmer ». État visible de la confirmation de l'autre personne (« en attente de Marc D. » / « confirmé des deux côtés »).
- **Mon compteur** (onglet 2) — mes kilomètres, mes trajets, mon CO₂ évité, mon estimation de forfait.
- **RH** (onglet 3, **visible uniquement pour le rôle RH**) — les chiffres agrégés de l'entreprise, l'évolution mensuelle, le bouton de génération des attestations du mois.
- **Réglages** — mon profil, mes notifications, confidentialité, conditions, **suppression du compte**, déconnexion.

Navigation : 2 onglets pour un salarié (Trajets · Mon compteur), 3 pour un RH (Trajets · Mon compteur · RH), réglages accessibles en haut à droite. **L'onglet RH n'est pas seulement masqué visuellement : les données correspondantes sont inaccessibles côté serveur pour un non-RH** (voir Sécurité).

---

## Compte utilisateur : oui — email professionnel + lien magique (Supabase Auth)

Aucun mot de passe. Aucun login social — donc **pas d'obligation Sign in with Apple** (guideline 4.8). Le compte est indispensable dès le premier écran : c'est une app d'entreprise, il n'y a rien à montrer à quelqu'un qui n'appartient à aucune entreprise cliente. C'est un cas admis par Apple (app réservée à des utilisateurs professionnels identifiés), à condition de fournir des comptes de démonstration — ce qui est prévu.

Trois rôles : **salarié**, **RH** (salarié + accès aux agrégats de son entreprise), **éditeur** (vous — back-office web uniquement, aucun accès depuis l'app mobile).

## Monétisation : aucune dans l'app

App **entièrement gratuite**, aucun achat intégré, aucun contenu déverrouillable. Le modèle est un **abonnement B2B facturé à l'entreprise hors de l'app** (par vous, depuis le back-office). C'est conforme : Apple n'exige l'achat intégré que pour du contenu numérique vendu **à l'utilisateur de l'app** ; un abonnement d'entreprise négocié en dehors n'entre pas dans ce cadre. Aucun écran de l'app ne mentionnera de prix, d'abonnement ou de lien d'achat — c'est la règle à tenir pour éviter la guideline 3.1.1.

## IA : non

Aucune IA, aucun appel à un prestataire d'IA. Donc aucun écran de consentement IA, aucune clé d'API à sécuriser, aucun coût variable.

## Données stockées (Supabase)

- **Entreprises** : nom, domaines email autorisés, statut d'abonnement, paramètres (seuil de masquage, barème kilométrique).
- **Salariés** : email pro, prénom, nom, commune de résidence, site de travail, entreprise, rôle.
- **Trajets récurrents** : entreprise, auteur, rôle, commune de départ, commune d'arrivée, jours, horaires aller/retour, places, distance calculée, actif/inactif.
- **Participations** : trajet, passager, statut (demandée / acceptée / refusée / annulée).
- **Confirmations quotidiennes** : trajet, date, sens (aller/retour), confirmation conducteur, confirmation passager, kilomètres validés.
- **Communes** : référentiel INSEE complet — **35 014 entrées** : les 34 969 communes de France (métropole et outre-mer) plus les **45 arrondissements municipaux** de Paris, Lyon et Marseille, traités comme des communes à part entière pour que le rapprochement reste fin dans les grandes villes. Importé une fois depuis `geo.api.gouv.fr` (API officielle de l'État) par `scripts/import-communes.mjs`, puis servi depuis notre base : l'app n'appelle jamais de service externe. **Donnée publique, aucune donnée personnelle.**
- **Attestations générées** : entreprise, mois, salarié, kilomètres, date de génération.

Hébergement Supabase, **région Europe (Francfort ou Paris)** — exigence RGPD non négociable pour des données de salariés français.

---

## Sécurité multi-tenant — LE point critique du projet

L'isolation entre entreprises ne repose **jamais** sur un filtre écrit dans l'app. Un filtre côté app se contourne en dix minutes avec les identifiants publics de l'application. L'isolation est appliquée **dans la base de données elle-même**, par la RLS Supabase (« Row Level Security » : la base refuse de servir une ligne à quelqu'un qui n'a pas le droit de la voir, quelle que soit la question posée).

Règles à implémenter et à **prouver par des tests automatisés** :

- [ ] Chaque table métier porte une colonne `entreprise_id` — aucune exception.
- [ ] L'entreprise de l'utilisateur est dérivée **côté serveur** de son compte authentifié, jamais d'un paramètre envoyé par l'app.
- [ ] Un salarié ne peut lire que les lignes de **son** entreprise. Test : le salarié A de l'entreprise 1 tente de lire les trajets de l'entreprise 2 → 0 ligne.
- [ ] Un salarié ne peut modifier ou supprimer que **ses propres** trajets et participations.
- [ ] **Précision apportée à l'implémentation (2026-08-10)** : un RH est aussi un salarié qui covoiture. Dans l'app, il a donc exactement les **mêmes droits qu'un collègue ordinaire** — il voit les trajets de son entreprise, publie les siens, confirme les siens. Son rôle RH ne lui ajoute **rien d'autre** que l'accès aux agrégats. Il ne voit jamais les confirmations ni les attestations de qui que ce soit, y compris dans sa propre entreprise.
- [ ] Un RH ne lit **que des agrégats**, et uniquement de **son** entreprise. Il n'a **aucun** accès en lecture aux tables de trajets, participations et confirmations — les chiffres lui sont servis par des vues agrégées dédiées, seule surface qui lui est ouverte. Test : le RH de l'entreprise 1 tente de lire un trajet nominatif → refusé ; tente de lire les agrégats de l'entreprise 2 → 0 ligne.
- [ ] Les vues RH appliquent le **seuil de masquage à 5 participants actifs** dans la vue elle-même, pas dans l'app.
- [ ] Le rôle RH est porté par la base, pas par l'app : masquer l'onglet côté iPhone est du confort, pas de la sécurité.
- [ ] La clé de service (`service_role`, qui ignore toute la RLS) n'existe **que** dans le back-office web et les fonctions serveur. Elle n'est **jamais** embarquée dans l'app iPhone.
- [ ] Un jeu de tests d'isolation tourne à chaque déploiement et **bloque la mise en ligne** s'il échoue.

## Conformité RGPD (contrainte forte, assumée dans le produit)

- [ ] **Seuil de masquage à 5** sur tous les chiffres RH — sous 5 participants actifs sur la période, affichage « données insuffisantes » au lieu du chiffre.
- [ ] **Aucun trajet identifiable ni aucun nom** dans l'onglet RH, à aucun moment, y compris dans les exports RH.
- [ ] **Exception unique et cadrée : l'attestation de forfait mobilités durables**, nominative par nature (c'est un document légal destiné au salarié et à l'URSSAF). Elle est générée hors app, sur déclenchement RH, et cette finalité est écrite noir sur blanc dans la politique de confidentialité.
- [ ] **Minimisation** : prénom + initiale dans toute l'app entre collègues ; le nom complet n'existe que sur l'attestation.
- [ ] **Consentement à l'inscription** : le salarié accepte explicitement que ses kilomètres confirmés soient comptabilisés et transmis à son employeur sous forme agrégée, et nominative pour la seule attestation.
- [ ] **Droit à l'effacement** : suppression du compte depuis l'app ; les trajets passés sont anonymisés, les agrégats historiques restent (ils ne permettent plus de remonter à la personne).
- [ ] **Hébergement UE** (Supabase région Europe).
- [ ] **Durée de conservation** : confirmations et trajets conservés 3 ans (durée de contrôle URSSAF), puis purge automatique.

## Conformité Apple (à respecter au build)

- [ ] **Suppression de compte in-app** (5.1.1(v)) — présente dans Réglages, effective, sans passer par un email.
- [ ] **Politique de confidentialité** publiée et liée depuis l'app et depuis la fiche App Store.
- [ ] **Deux comptes de démonstration fournis** dans les notes de review (2.1) — un salarié et un RH, sur une entreprise fictive pré-remplie de données crédibles. **Point d'attention majeur : le lien magique est incompatible avec un relecteur Apple**, qui ne peut pas relever un email pro. Parade obligatoire : ces deux comptes acceptent un **code de connexion fixe** communiqué à Apple dans les notes de review, actif **uniquement** pour ces deux comptes de démonstration.
- [ ] **Aucune mention de prix, d'abonnement ou de paiement** dans l'app (3.1.1).
- [ ] **Pas de login social** → Sign in with Apple non requis (4.8).
- [ ] **Pas de texte libre entre utilisateurs** en v1 → obligations de modération UGC (1.2) non déclenchées.
- [ ] **Notifications push** justifiées et non commerciales : uniquement le rappel de confirmation du jour, désactivable dans les réglages.
- [ ] **Risque 4.2 « app trop simple »** : écarté — l'app a un vrai back-end, des rôles, des calculs et une navigation propre. Le point de vigilance est plutôt de bien montrer, dès les captures d'écran, qu'il s'agit d'une vraie app et non d'un formulaire web habillé.
- [ ] **Risque 4.3 / 4.2.2 « app d'entreprise à diffusion limitée »** : Apple demande parfois pourquoi une app réservée à des salariés n'est pas distribuée en interne. Parade : Klaxon est un service **multi-entreprises** ouvert à toute société cliente — c'est ce qui justifie l'App Store public. À écrire explicitement dans les notes de review.

## Faisabilité technique

Contrainte de base : l'app se teste en **Expo Go** (l'application gratuite qui affiche le projet sur votre iPhone sans build). Tout ce qui demande une brique native absente d'Expo Go doit avoir un repli, ou attendre le build réel.

- [ ] **Pas de carte interactive** → décision produit déjà prise : rapprochement par commune et créneau. **Aucune brique native, rien à contourner.** C'est ce qui rend ce projet confortable techniquement.
- [ ] **Distance entre communes** → calculée à partir du **référentiel INSEE des communes françaises** (coordonnées officielles), stocké dans notre base et servi à l'app. Distance à vol d'oiseau × coefficient routier standard (1,3). Aucun service de cartographie externe, aucune donnée qui sort, aucun coût. Précision largement suffisante pour un forfait mobilités durables, qui se calcule sur des kilomètres déclarés.
- [ ] **Notifications push** (rappel de confirmation) → ne fonctionnent pas en Expo Go, mais **ce n'est pas un trou** : elles se testent sur le build réel / TestFlight. Repli pendant le développement : l'écran de confirmation du jour est aussi accessible directement depuis l'onglet Trajets, donc la fonctionnalité reste utilisable même sans notification.
- [ ] **Lien magique** (deep link qui rouvre l'app) → même situation : se teste sur le build réel. Repli en développement : saisie d'un code à 6 chiffres reçu par email.
- [ ] **Génération des attestations** (PDF) → faite **côté serveur** (back-office / fonction serveur), pas sur le téléphone. C'est plus simple, plus sûr, et ça évite toute brique native.
- [ ] **Import de salariés** (fichier CSV) → back-office web uniquement, jamais depuis l'app.
- [ ] Aucun Bluetooth, aucun capteur, aucune caméra, aucune IA, aucun paiement natif. **RAS : rien hors de portée d'Expo Go.**

---

## Back-office web (Next.js) — réservé à l'éditeur

Application web séparée, déployée sur son propre domaine, **sans aucun lien depuis l'app mobile**. Accès réservé aux comptes éditeur, protégé par un second facteur.

- **Entreprises** — création, nom, **domaines email autorisés** (plusieurs par entreprise), paramètres (barème kilométrique, seuil de masquage), activation / suspension.
- **Comptes RH** — désignation d'un salarié existant comme RH, retrait du rôle, historique des désignations.
- **Import de salariés** — fichier CSV (email pro, prénom, nom, commune), pré-création des comptes, rapport d'import ligne par ligne.
- **Attestations** — suivi des générations lancées par les RH, régénération, téléchargement.
- **Exports** — export des données d'une entreprise (agrégats, et nominatif uniquement pour les attestations), au format CSV.
- **Corrections** — annuler une confirmation erronée, corriger une distance, désactiver un trajet frauduleux. Chaque correction est **tracée** (qui, quand, quoi, pourquoi) — indispensable si l'URSSAF conteste un forfait versé.
- **Vue consolidée** — tous clients confondus : entreprises actives, salariés inscrits, trajets confirmés, kilomètres, CO₂. C'est votre tableau de bord commercial.
- **Facturation** — abonnement par entreprise, volumétrie facturable, génération des factures. Aucun encaissement automatisé en v1 : le back-office produit la facture, l'encaissement se fait par virement hors outil.

---

## Design : sobre et matinal

Une app qu'on ouvre à 7h du matin, à moitié réveillé, dans une entrée d'immeuble. Donc : très peu d'éléments par écran, gros boutons, contraste fort, aucune animation gratuite. Deux couleurs, une police lisible, beaucoup de blanc. L'écran de confirmation du jour doit être le plus simple de toute l'app — un titre, une phrase, un bouton. Rien qui ressemble à une app grand public bavarde : c'est un outil professionnel, la crédibilité vient de la sobriété. Ambiance affinée par `/ui`.

---

## Comptes de démonstration (pour la review Apple)

Entreprise fictive **« La Fabrique »** (domaine `lafabrique.demo`), pré-remplie de trajets, participations et confirmations crédibles sur trois mois, plus une seconde entreprise fictive **« Groupe Vernet »** — présente uniquement pour prouver, données à l'appui, que l'isolation fonctionne : le compte de démonstration ne doit jamais en voir la moindre trace.

- **Salarié** : `demo.salarie@lafabrique.demo` — trajets publiés, une participation acceptée, un trajet à confirmer le jour même.
- **RH** : `demo.rh@lafabrique.demo` — onglet RH visible, chiffres agrégés au-dessus du seuil de 5, génération d'attestation testable.

Les deux se connectent avec un **code fixe** transmis à Apple dans les notes de review (le lien magique par email étant impraticable pour un relecteur). Ce code n'est actif que sur ces deux comptes, sur l'entreprise de démonstration, et ne donne accès à rien d'autre.
