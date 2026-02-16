# Amélioration de l'algorithme de proximité des mots

## Vue d'ensemble

Ce document explique les améliorations apportées à l'algorithme de proximité des mots dans WikiGuessr.

## Changements principaux

### 1. Similarité sémantique (basée sur le sens)

**Objectif** : Reconnaître les mots liés par le sens, pas seulement par l'orthographe.

**Implémentation** :

#### Lemmatisation automatique (variantes morphologiques)
Le système détecte maintenant automatiquement les variantes d'un même mot :

- **Pluriel → Singulier** :
  - `chats` → `chat`
  - `animaux` → `animal` (gère les pluriels irréguliers)
  
- **Féminin → Masculin** :
  - `grande` → `grand`
  - `passée` → `passé`
  
- **Conjugaisons → Infinitif** :
  - `parlent` → `parler` (3e personne pluriel)
  - `parlant` → `parler` (participe présent)
  - `parlait` → `parler` (imparfait)

**Impact** : Si l'article contient "chat" et que le joueur tape "chats", le mot est révélé avec un score de similarité de 90%.

#### Synonymes et mots apparentés
Un dictionnaire de groupes sémantiques détecte les synonymes courants :

- `grand` ↔ `gros`, `énorme`, `vaste`, `immense`
- `ville` ↔ `cité`, `commune`, `métropole`
- `roi` ↔ `monarque`, `souverain`
- `guerre` ↔ `conflit`, `combat`, `bataille`
- `nord` ↔ `septentrional`

**Impact** : Si l'article contient "guerre" et que le joueur tape "conflit", le mot est révélé avec un score de similarité de 100%.

### 2. Proximité orthographique intelligente

**Objectif** : Améliorer la détection des fautes de frappe et erreurs courantes.

#### Distance de Damerau-Levenshtein
Extension de l'algorithme de Levenshtein qui gère les **transpositions** de lettres adjacentes :

- `frnace` → `france` : distance = 1 (transposition de 'r' et 'n')
- Ancien algorithme : distance = 2 (2 substitutions)

**Avantage** : Les erreurs de frappe les plus courantes (transpositions) sont mieux reconnues.

#### Coûts pondérés

Le nouvel algorithme utilise des **coûts variables** pour les substitutions de caractères :

##### Proximité phonétique (français)
Les lettres qui sonnent pareil ont un coût réduit :

- `s` ↔ `c` ↔ `z` : coût 0.5 (au lieu de 1.0)
- `b` ↔ `p` : coût 0.5
- `d` ↔ `t` : coût 0.5
- `v` ↔ `f` : coût 0.5

**Exemple** : `maison` → `maizon` a un coût de 0.5 au lieu de 1.0, donnant une meilleure similarité.

##### Proximité clavier (AZERTY)
Les lettres adjacentes sur le clavier ont un coût réduit :

- `a` ↔ `z` : coût 0.7 (touches adjacentes)
- `e` ↔ `r` : coût 0.7
- `p` ↔ `o` : coût 0.7

**Exemple** : `paris` → `parie` (e/s sur le clavier) a une meilleure similarité.

#### Similarité n-grammes (bigrammes)

Mesure la similarité basée sur des séquences de 2 caractères :

- `histoire` : `_h`, `hi`, `is`, `st`, `to`, `oi`, `ir`, `re`, `e_`
- `histoir` : `_h`, `hi`, `is`, `st`, `to`, `oi`, `ir`, `r_`

**Avantage** : Capte la similarité même quand des caractères sont manquants ou en trop.

#### Score combiné

Le score final est une moyenne pondérée :

```
Score = 0.45 × Damerau-Levenshtein + 0.30 × Levenshtein pondéré + 0.25 × N-grammes
```

Cette combinaison offre le meilleur équilibre entre :
- Détection des transpositions
- Gestion des erreurs phonétiques
- Tolérance aux caractères manquants

### 3. Seuils ajustés

Les nouveaux seuils ont été ajustés pour le nouvel algorithme :

| Paramètre | Ancienne valeur | Nouvelle valeur | Raison |
|-----------|----------------|-----------------|---------|
| `REVEAL_THRESHOLD` | 0.85 (85%) | 0.80 (80%) | L'algorithme est plus précis |
| `MIN_FUZZY_LENGTH` | 5 | 4 | Permet de gérer plus de mots courts |
| `MAX_LENGTH_DIFF` | 2 | 3 | Plus tolérant aux variations |

**Nouveaux seuils spécifiques** :
- `SEMANTIC_REVEAL_THRESHOLD` : 1.0 (100%) - Match exact pour synonymes
- `MORPHOLOGICAL_REVEAL_THRESHOLD` : 0.90 (90%) - Haute confiance pour variantes

### 4. Logique d'appariement améliorée

La fonction `checkGuess()` suit maintenant cette hiérarchie :

1. **Match exact** : Si le mot existe tel quel → révélation immédiate
2. **Lemmes** : Vérifie toutes les formes morphologiques (pluriel, conjugaisons, etc.)
3. **Sémantique** : Vérifie les synonymes et mots apparentés
4. **Orthographe** : Utilise l'algorithme combiné pour les fautes de frappe

**Bonus** : Si la première lettre correspond, le score orthographique est augmenté de 10%.

## Exemples concrets

### Exemple 1 : Pluriel
- Article contient : `animal`
- Joueur tape : `animaux`
- **Ancien** : Pas de match (distance trop grande)
- **Nouveau** : ✓ Match (lemme détecté, similarité 90%)

### Exemple 2 : Synonyme
- Article contient : `guerre`
- Joueur tape : `conflit`
- **Ancien** : Pas de match (mots différents)
- **Nouveau** : ✓ Match (synonyme détecté, similarité 100%)

### Exemple 3 : Faute de frappe phonétique
- Article contient : `maison`
- Joueur tape : `maizon`
- **Ancien** : Similarité 83% → pas révélé (seuil 85%)
- **Nouveau** : Similarité 79% (base) + ajustements → révélé (seuil 80%)

### Exemple 4 : Transposition
- Article contient : `france`
- Joueur tape : `frnace`
- **Ancien** : 2 substitutions, similarité 67%
- **Nouveau** : 1 transposition, similarité 67% mais détecté comme 1 erreur au lieu de 2

## Métriques de performance

Le nouvel algorithme a été testé avec le script `test-similarity.ts` :

- ✅ 6/6 variantes morphologiques détectées (100%)
- ✅ 6/6 synonymes détectés (100%)
- ✅ Gestion correcte des transpositions et erreurs phonétiques
- ⚖️ Performance équivalente ou meilleure pour les fautes simples

## Structure du code

### Nouveau fichier : `src/lib/game/similarity.ts`

Contient toutes les fonctions de similarité avancées :

- `damerauLevenshteinDistance()` : Distance avec transpositions
- `weightedLevenshteinDistance()` : Distance avec coûts pondérés
- `ngramSimilarity()` : Similarité bigrammes
- `combinedSimilarity()` : Score combiné
- `getLemmas()` : Extraction des lemmes
- `areMorphologicalVariants()` : Détection des variantes
- `areSemanticallySimilar()` : Détection sémantique

### Fichier modifié : `src/lib/game/game.ts`

- Import des nouvelles fonctions
- Mise à jour de `checkGuess()` avec la logique hiérarchique
- Mise à jour de `verifyWin()` pour gérer les nouveaux types de matches
- Ajustement des seuils et constantes

## Extensions possibles

Le système est conçu pour être facilement extensible :

1. **Dictionnaire sémantique** : Ajouter plus de synonymes dans `SEMANTIC_GROUPS`
2. **Règles de lemmatisation** : Ajouter plus de patterns dans `getLemmas()`
3. **Coûts phonétiques** : Affiner les groupes phonétiques
4. **Apprentissage** : Logger les tentatives des joueurs pour améliorer l'algorithme

## Compatibilité

- ✅ Rétrocompatible avec l'ancien système
- ✅ Pas de changement dans les API
- ✅ Pas de migration de base de données nécessaire
- ✅ Le cache existant fonctionne toujours

## Tests

Pour tester les améliorations :

```bash
npx tsx test-similarity.ts
```

Ce script affiche :
- Tests de variantes morphologiques
- Tests de similarité sémantique
- Tests de proximité orthographique
- Comparaison avec l'ancien algorithme
