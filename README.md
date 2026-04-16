# WikiGuessr

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/c0fa28c225044b569bfc25e63924e287)](https://app.codacy.com/gh/Wiibleyde/WikiGuessr/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-Runtime_%26_Tests-F9F1E1?logo=bun&logoColor=black)
![License](https://img.shields.io/badge/Licence-GPL--3.0-4B5563)

Un jeu de devinettes quotidien basé sur Wikipédia. Chaque jour, une page Wikipédia est sélectionnée, son contenu est découpé en tokens, puis ses mots sont masqués. Le but est de retrouver progressivement l'article jusqu'à révéler son titre.

## Aperçu

- Un nouvel article Wikipédia chaque jour
- Masquage intelligent des mots avec ponctuation visible
- Correspondance floue pour accepter les propositions proches
- Indices image progressifs après plusieurs essais
- Authentification Discord via Supabase Auth
- Sauvegarde de progression pour les utilisateurs connectés
- Classements, statistiques de profil et historique
- Mode coopératif en temps réel

## Stack technique

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 4 |
| Etat client | React Context + hooks |
| Data fetching | TanStack Query 5 |
| HTTP | Axios |
| Authentification | Supabase Auth + Discord OAuth |
| Base de données | PostgreSQL via Prisma 7 |
| Temps réel | Supabase Realtime |
| Validation | Zod |
| Linter / Formatter | Biome 2.2 |
| Tests | Bun test |
| Package manager | Bun |

## Démarrage rapide

### Prérequis

- Bun >= 1.0
- Docker et Docker Compose pour PostgreSQL local
- Une application Discord si vous activez l'authentification

### Installation

```bash
git clone https://github.com/Wiibleyde/BetterWikiGuessr.git
cd BetterWikiGuessr
bun install
```

Le script post-install génère automatiquement le client Prisma.

### Configuration

Copier le fichier d'exemple et renseigner les valeurs :

```bash
cp .env.example .env
```

Le `.env.example` contient toutes les variables nécessaires (Supabase self-hosted, PostgreSQL, Discord OAuth, etc.). Les variables propres à l'application Next.js se trouvent dans la section **WikiGuessr App** du fichier.

### Lancer en local

```bash
# Démarrer PostgreSQL
docker compose up -d postgres

# Appliquer les migrations
bun run db:migrate

# Lancer le serveur Next.js
bun run dev
```

L'application est disponible sur `http://localhost:3000`.

## Développement avec Docker

Le dépôt contient un `docker-compose.yml` qui démarre PostgreSQL et l'application Next.js.

```bash
docker compose up --build
```

L'image applicative génère Prisma, build l'application en mode standalone, puis démarre le serveur via `docker-entrypoint.sh`.

## Commandes utiles

```bash
bun run dev            # Serveur de développement
bun run build          # Build de production
bun run start          # Serveur de production
bun run lint           # Vérification Biome
bun run format         # Formatage Biome

bun run test           # Tests unitaires Bun
bun run test:watch     # Tests en mode watch
bun run test:coverage  # Couverture de tests
bun run test:e2e       # Tests Playwright

bun run db:generate    # Générer le client Prisma
bun run db:migrate     # Créer/appliquer une migration Prisma
```

## Architecture

### Frontend

- `src/app/` contient les pages App Router, métadonnées et routes API
- `src/components/` contient les composants UI et sous-modules d'interface
- `src/provider/` et `src/context/` gèrent les providers et contextes globaux

### Etat client

- `src/hooks/` orchestre le chargement d'article, les soumissions, la synchro et le mode coop
- `src/context/` centralise les états globaux côté client

### Backend

- `src/lib/controllers/` valide les requêtes et formate les réponses
- `src/lib/services/` porte la logique applicative
- `src/lib/game/` contient la logique métier liée au jeu et aux articles Wikipédia
- `src/lib/repositories/` encapsule les accès Prisma

## API principale

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/game` | Retourne l'article masqué du jour |
| POST | `/api/game/guess` | Vérifie un mot proposé |
| POST | `/api/game/complete` | Enregistre une victoire |
| PUT | `/api/game/state` | Sauvegarde l'état d'une partie connectée |
| GET | `/api/game/state` | Restaure l'état d'une partie connectée |
| POST | `/api/game/reveal` | Révèle tous les mots après vérification de victoire |
| GET | `/api/game/yesterday` | Retourne le titre de la veille |
| POST | `/api/game/hint` | Débloque un indice image |
| GET | `/api/game/hint/image` | Sert une image d'indice obfusquée |
| GET | `/api/historic` | Retourne l'historique des articles |
| GET | `/api/leaderboard` | Retourne les classements |
| GET | `/api/profile/stats` | Retourne les statistiques du profil |
| GET | `/api/auth/callback/[provider]` | Callback OAuth Supabase |

## Base de données

Le schéma Prisma couvre les modèles applicatifs suivants :

- `User` (profil synchronisé depuis `auth.users` via un trigger)
- `DailyWikiPage`, `GameResult`, `GameState`

Le client Prisma généré est placé dans `generated/prisma/` et ne doit pas être modifié manuellement.

## Structure du projet

```text
src/
├── app/                  # Pages, layouts, métadonnées et routes API
├── components/           # Composants UI et sous-modules d'interface
├── constants/            # Constantes métier
├── context/              # Contextes React
├── hooks/                # Hooks client
├── lib/                  # Logique métier, auth, repositories, services
├── provider/             # Providers globaux
├── test/                 # Tests Bun
├── types/                # Types partagés
└── utils/                # Utilitaires transverses
prisma/
├── schema.prisma         # Schéma Prisma
└── migrations/           # Migrations SQL
generated/
└── prisma/               # Client Prisma généré
```

## Qualité

Pour vérifier un changement avant ouverture de PR :

```bash
bun run lint
bun run test
bun run build
```

## Contribution

Les contributions se font depuis des branches de feature vers `develop`.

1. Créer une branche depuis `develop`
2. Développer et lancer `bun run lint`
3. Exécuter les tests pertinents
4. Ouvrir une pull request vers `develop`
