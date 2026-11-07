# AGENTS.md — règles générales pour tous les agents (CI, code, voix)

Ces règles s'appliquent à tous les agents travaillant sur n'importe quel projet. Elles doivent être recopiées dans le fichier `agents.md` (ou `AGENTS.md`) de chaque nouveau dépôt.

## 1. CI — jamais plus de 5 minutes

- Toute la CI d'un projet (lint, tests, build) doit se terminer en **moins de 5 minutes** au total.
- À la création de tout nouveau dépôt, configurer la CI pour respecter cette limite :
  - parallaxer les tests et le lint (matrice de jobs) au lieu de les séquentiels ;
  - activer le cache des dépendances (npm/pnpm/yarn cache, pip cache, Cargo cache, etc.) ;
  - ne lancer que les tests impactés par le diff quand c'est possible (turborepo, nx, pytest --selected, etc.) ;
  - limiter les suites à ce qui est nécessaire sur chaque PR (les tests lourds/intégration seulement sur tag, nightly ou demandé) ;
  - activer le mode CI de l'outil de build (vitest --run, jest --ci, etc.) et_timeout courts avec fail-fast.
- Si une CI dépasse 5 minutes, c'est un bug à corriger : déplier, réduire la granularité des jobs, cacher, isoler les tests lents — pas juste augmenter le timeout.

## 2. Taille du code

- **Fichiers de code : jamais plus de 500 lignes.** Au-delà, découper en modules séparés (un module = une responsabilité).
- **Fonctions : jamais plus de 50 lignes.** Au-delà, extraire des sous-fonctions avec un nom explicite.

## 3. Réutilisabilité maximale du code

- Écrire le code le plus réutilisable possible :
  - pas de logique dupliquée — si un même bloc existe à deux endroits, l'extraire dans une fonction ou un module partagé ;
  - séparer la logique métier (testable, pure) de l'interface / du système de fichiers / du réseau ;
  - glanages config-driven : constantes en haut de fichier ou dans un fichier de config, pas en dur au milieu du code ;
  - noms, conventions typiques du langage utilisé, petits fichiers, petits exports, API claires — tout doit être importable ailleurs sans effet de bord ;
  - privilégier la花花 composition : petites fonctions combinées plutôt que gros blocs monolithiques.

## 4. Voix avec ElevenLabs

Quand une tâche nécessite de la synthèse vocale (TTS) avec ElevenLabs, utiliser une clé API configurée via variable d'environnement :

```
XI_API_KEY=<clé-ElevenLabs-à-définir-dans-.env-ou-secret-CI>
```

- Mettre la clé dans une variable d'environnement (`.env`, secret CI), **jamais en dur dans le code source commité**.
- En cas d'échec (quota, erreur d'API) sur une clé, tenter une autre clé configurée.

## 5. PR automatique en fin de tâche

- Quand un agent a terminé sa tâche, il **doit automatiquement ouvrir une Pull Request** — ne jamais laisser le travail uniquement en local ou sur une branche sans PR.
- Règles :
  - ne jamais pusher directement sur `main` : travailler sur une branche (`feat/...`, `fix/...`, `agents/...`) ;
  - pusher la branche sur `origin` ;
  - créer la PR vers `main` avec `gh pr create` (titre clair, description : ce qui a été fait + comment tester) ;
  - si une PR existe déjà pour la branche, la mettre à jour au lieu d'en créer une en double.
- La tâche n'est considérée comme finie que lorsque la PR est ouverte (ou mise à jour) et que la CI est verte ou en cours.
