# WikiGuessr

Un jeu de devinettes quotidien basé sur Wikipédia. Chaque jour, une page Wikipédia est sélectionnée, son contenu est découpé en tokens, puis ses mots sont masqués. Le but est de retrouver progressivement l'article jusqu'à révéler le titre.

## Fonctionnalités

- Jeu quotidien avec un nouvel article chaque jour
- Masquage des mots avec ponctuation toujours visible
- Correspondance floue pour accepter les mots proches
- Indices image progressifs après plusieurs essais
- Authentification Discord via Better Auth pour sauvegarder la progression
- Sauvegarde de l'état de partie pour les utilisateurs connectés
- Classements et statistiques de profil
- Historique des articles précédents

## Stack technique

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Langage | TypeScript 5 |
| Style | Tailwind CSS 4 |
| Etat client | Jotai + hooks React |
| Authentification | Better Auth + Discord OAuth |
| Base de données | PostgreSQL via Prisma 7 |
| Data Fetching | SWR |
| Linter / Formatter | Biome 2.2 |
| Tests | Bun test |
| Package manager | Bun |

## Prérequis

- Bun >= 1.0
- Docker et Docker Compose pour PostgreSQL local
- Une application Discord si vous activez l'authentification

## Installation

```bash
git clone https://github.com/Wiibleyde/BetterWikiGuessr.git
cd BetterWikiGuessr
bun install
```

Le script post-install génère automatiquement le client Prisma.

## Configuration

Créer un fichier `.env` à la racine du projet :

```env
DATABASE_URL=postgresql://wikiguessr:wikiguessr@localhost:5432/wikiguessr

# Better Auth
BETTER_AUTH_SECRET=replace-with-a-secret-of-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Optionnel
GAME_TIMEZONE=Europe/Paris
```

## Lancer le projet en local

```bash
# Démarrer PostgreSQL
docker compose up -d postgres

# Appliquer les migrations
bun run db:migrate

# Lancer le serveur Next.js
bun run dev
```

L'application est disponible sur http://localhost:3000.

## Développement avec Docker

Le dépôt contient un `docker-compose.yml` qui démarre PostgreSQL et l'application Next.js.

```bash
docker compose up --build
```

L'image applicative exécute la génération Prisma, le build Next.js standalone, puis démarre l'application via `docker-entrypoint.sh`.

## Commandes disponibles

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

### Interface

- `src/app/` contient les pages App Router, les routes API, `layout.tsx`, `robots.ts` et `sitemap.ts`
- `src/components/` contient les composants UI, avec des sous-dossiers pour l'article, l'historique, la navbar, le leaderboard, le profil et les composants génériques
- `src/providers/` et `src/contexts/` gèrent les providers React globaux

### Etat client

- `src/atom/game.ts` centralise l'état principal du jeu avec Jotai
- `src/hooks/useArticle.ts`, `useGame.ts`, `useGuess.ts`, `useDb.ts` et `useWikiGuessr.ts` orchestrent le chargement d'article, les soumissions, les indices et la synchronisation serveur

### Backend

- `src/controllers/` valide les requêtes HTTP et formate les réponses
- `src/services/` contient la logique applicative par domaine
- `src/lib/game/` contient la logique métier du jeu, la récupération Wikipédia et la rotation quotidienne
- `src/lib/repositories/` encapsule les accès Prisma
- `src/utils/handler.ts` fournit les wrappers d'erreur, d'authentification et de rate limit

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
| GET / POST | `/api/auth/[...betterauth]` | Endpoints Better Auth |

## Base de données

Le schéma Prisma couvre :

- les modèles Better Auth (`User`, `Session`, `Account`, `Verification`)
- les modèles applicatifs (`DailyWikiPage`, `GameResult`, `GameState`)

Le client Prisma généré est placé dans `generated/prisma/` et ne doit pas être modifié manuellement.

## Tests

Les tests actuels vivent dans `src/test/`.

- `src/test/normalize.test.ts`
- `src/test/game.test.ts`

## Structure du projet

```text
src/
├── app/                  # Pages, layouts, métadonnées et routes API
├── atom/                 # Atomes Jotai du jeu
├── components/           # Composants UI et sous-modules d'interface
├── constants/            # Constantes métier
├── contexts/             # Contextes React
├── controllers/          # Entrées HTTP
├── hooks/                # Hooks client
├── lib/                  # Logique métier, auth, Prisma, repositories
├── providers/            # Providers globaux
├── services/             # Cas d'usage applicatifs
├── test/                 # Tests Bun
├── types/                # Types partagés
└── utils/                # Utilitaires transverses
prisma/
├── schema.prisma         # Schéma Prisma
└── migrations/           # Migrations SQL
generated/
└── prisma/               # Client Prisma généré
```

## Contribution

Les contributions se font depuis des branches de feature vers `develop`.

1. Créer une branche depuis `develop`
2. Développer et lancer `bun run lint`
3. Exécuter les tests pertinents
4. Ouvrir une pull request vers `develop`
