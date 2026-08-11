# Klaxon

**Le covoiturage entre collègues, en deux appuis.**

Application de covoiturage domicile-travail réservée aux salariés d'une même entreprise, avec
un espace RH en données agrégées et un back-office d'administration.

## Structure

| Dossier | Rôle |
|---|---|
| `mobile/` | L'application iPhone (Expo SDK 57, Expo Router, TypeScript) |
| `site/` | La landing et les pages légales (Next.js, statique) |
| `db/` | Les migrations SQL, dans l'ordre |
| `scripts/` | Migrations, tests d'isolation, tests métier, données de démonstration |
| `brand/`, `tools/` | La source vectorielle de l'icône et son générateur |

## Le point critique : l'isolation entre entreprises

Un salarié ne voit rien d'une autre entreprise, un RH non plus. Cette isolation **n'est jamais
appliquée par l'application** : elle l'est par la base de données (Row Level Security), qui refuse
de servir une ligne à quelqu'un qui n'y a pas droit, quelle que soit la requête.

Trois principes qui en découlent :

1. **L'application n'envoie jamais l'entreprise ni l'auteur** d'un trajet. La base les déduit du
   compte connecté et rejette explicitement toute valeur qui ne correspond pas.
2. **Les kilomètres ne se saisissent pas.** La base recalcule la distance et ne la comptabilise que
   si le conducteur *et* le passager ont confirmé, le jour même.
3. **Un RH n'a aucun privilège de lecture supplémentaire.** Son rôle n'ouvre que des agrégats,
   masqués sous 5 participants — jamais un trajet, jamais un nom, même dans sa propre entreprise.

Le tout est vérifié par des tests qui tentent activement de franchir la cloison :

```bash
node scripts/test-isolation.mjs   # 14 tentatives d'intrusion, toutes doivent être bloquées
node scripts/test-metier.mjs      # le parcours complet, de l'inscription aux kilomètres comptés
node scripts/test-demo.mjs        # les comptes de démonstration de la review Apple
```

## Démarrer

```bash
cd mobile && npm install && npx expo start   # l'app, à ouvrir dans Expo Go
cd site && npm install && npm run dev        # le site
```

L'application lit sa configuration dans `mobile/.env` (voir `mobile/.env.example`). Les clés
d'administration vivent dans `.recette/secrets.env`, qui n'est jamais versionné.

## Migrations

```bash
node scripts/db-apply.mjs db/0001_init.sql   # à rejouer dans l'ordre sur une base neuve
```

## État

Voir [PROGRESS.md](PROGRESS.md) — ce qui est fait, ce qui reste, et les décisions prises en route.
