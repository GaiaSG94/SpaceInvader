# INTENT — Vision du projet SpaceInvader × GitHub × Kiro

> Document d'intention : ce que le projet veut devenir.
> Phase actuelle : jeu + flow GitHub côté client, SANS clé LLM (pas de crédits Kiro pour l'instant).
> Les briques Kiro ci-dessous décrivent l'infrastructure cible, pas l'état implémenté.

Dans ce projet d'application web reliée à GitHub, les technologies de Kiro (Kiro.dev)
ne servent plus à développer le jeu, mais agissent comme les organes internes et
l'infrastructure invisible qui font le lien entre votre score et vos fichiers de code.
Voici le rôle exact que joue chaque technologie de Kiro sous le capot du site :

## 1. Le Routeur Intelligent (Amazon Bedrock Orchestrator)

C'est le moteur de tarification et de performance du site.

- **Son rôle ici** : c'est lui qui écoute le WebSocket envoyé par le jeu JavaScript.
  Lorsque le score passe de x1 à x5, ce composant Kiro change instantanément les
  paramètres de l'appel API (les variables `modelId` et `temperature`) vers les
  serveurs cloud. Il gère l'accélération cognitive en s'assurant que l'IA d'élite
  ne s'active que lorsque le joueur joue parfaitement, protégeant ainsi le portefeuille.

## 2. Le Workflow "Spec-Driven Development" (Le Traducteur)

C'est le composant qui transforme le gameplay en architecture de code.

- **Son rôle ici** : l'agent IA ne peut pas coder n'importe comment pendant que le
  joueur tire sur des aliens. Cette brique Kiro prend l'Issue GitHub (le ticket de bug),
  la décompose au format syntaxique strict (EARS), et génère automatiquement le fichier
  temporaire `.kiro/tasks.md`. Ce fichier sert ensuite à générer la structure de la
  vague d'aliens (le nombre d'ennemis et leurs types) pour que le jeu soit le miroir
  exact de la complexité du bug.

## 3. Le Moteur d'Exécution Concurrent & DAG (Le Chef d'Orchestre)

C'est le gestionnaire des vaisseaux Ailiers.

- **Son rôle ici** : dans le code, la tâche "Correction du bug" dépend souvent de la
  tâche "Écriture des tests". Ce moteur calcule le graphe de dépendances (DAG). En jeu,
  il s'assure que si le joueur demande à l'Ailier Test (Touche 2) de foncer, le système
  cloud parallélise le travail dans GitHub. C'est lui qui gère la création des branches
  Git virtuelles éphémères pour chaque ailier en jeu.

## 4. Le Protocole MCP (Le Pont GitHub & Système)

C'est la prise universelle qui connecte le jeu à la réalité.

- **Son rôle ici** : le jeu lui-même est isolé dans le navigateur web du joueur.
  Le serveur MCP de Kiro sert de traducteur bidirectionnel. Il va chercher
  l'arborescence du dépôt GitHub, lit le contenu du fichier de code buggé, et le
  transmet au jeu pour que les aliens prennent la forme des lignes de code.

## 5. Les Agent Lifecycle Hooks & PBT (La Barrière de Sécurité)

C'est le contrôle technique avant la Pull Request finale.

- **Son rôle ici** : une fois la partie gagnée et la correction rédigée par l'IA, il ne
  faut pas qu'elle envoie du code qui casse le site. Le Post-run Hook de Kiro intercepte
  le code produit par l'IA juste avant la création de la Pull Request sur GitHub. Il fait
  tourner des tests de robustesse (Property-Based Testing). Si les tests échouent, le site
  affiche un écran "Game Over" (ou un niveau bonus de rattrapage) car le code de l'IA
  contenait encore un bug.

## Décision ouverte

Maintenant que les rôles sont clairs, par quelle brique commencer l'implémentation
sur le site : le Routeur Intelligent (pour connecter le score au changement de modèle
d'IA) ou le Protocole MCP (pour connecter GitHub au jeu) ?

## Risques : crédits Kiro incertains

Inquiétude notée le 2026-11-07 : les crédits Kiro du hackathon n'arrivent que le
1er décembre, sur demande, et la demande peut être refusée. Le projet ne doit donc
pas dépendre de Kiro pour fonctionner.

Parades retenues :

1. **Le site est 100 % utilisable sans aucune clé LLM** (état actuel) : jeu complet,
   connexion GitHub, issues → niveau, boss, récompense. L'absence de crédits ne bloque
   rien d'existant.
2. **L'IA est derrière une interface agnostique** (`site/js/ai.js` : `status()`,
   `planFix()`, `configure()`). Kiro n'est qu'un fournisseur possible parmi d'autres
   (Bedrock direct, Anthropic, OpenAI, modèle local) : on branche celui qu'on obtient
   sans réécrire le jeu ni le tableau de bord.
3. **Demander les crédits tôt** (dès l'ouverture) tout en gardant un plan B (autre
   fournisseur ou mode sans IA).
4. **Les briques Kiro restent des couches optionnelles** : Routeur, Spec-Driven,
   DAG, MCP, Hooks s'ajoutent au-dessus du flow GitHub qui tourne déjà, elles ne le
   remplacent pas.
