# Système de Bots/Crawlers

Ce dossier contient les bots responsables du crawl des différentes sources de données.

## Structure

- `index.js` : Point d'entrée principal, gère l'initialisation et la planification des bots
- `azureDevOpsBot.js` : Bot pour crawler les données Azure DevOps (pipelines, repositories, work items)

## Fonctionnalités

### Initialisation automatique

Les bots sont automatiquement initialisés au démarrage du serveur backend. Ils planifient les crawls selon la configuration de chaque source de données.

### Types de crawls

1. **Crawl initial** : Exécuté lors de la première connexion d'une source
   - Découvre les projets, pipelines, repositories
   - Identifie les utilisateurs impliqués
   - Retourne une structure complète des données disponibles

2. **Crawl régulier** : Exécuté selon le schedule configuré
   - Récupère les nouvelles données depuis le dernier crawl
   - Met à jour les événements et changelogs

3. **Crawl manuel** : Déclenché via l'API admin
   - Permet de forcer un crawl immédiat
   - Utile pour tester ou récupérer des données à la demande

## API Endpoints

### Crawl initial
```
POST /api/admin/data-sources/:id/crawl/initial
```

### Crawl manuel
```
POST /api/admin/data-sources/:id/crawl/manual
```

## Planification

Les crawls sont planifiés via `node-cron` selon :
- **Jours** : Tableau de jours de la semaine (0-6, dimanche = 0)
- **Heures** : Tableau d'heures (0-23)
- **Timezone** : Fuseau horaire (défaut: Europe/Paris)

Exemple de configuration :
```javascript
{
  schedule: {
    days: [1, 2, 3, 4, 5], // Lundi à Vendredi
    hours: [9, 12, 15, 18], // 9h, 12h, 15h, 18h
    timezone: 'Europe/Paris'
  }
}
```

## Ajouter un nouveau bot

1. Créer un nouveau fichier `nomBot.js` dans ce dossier
2. Implémenter les fonctions `initialCrawl(source)` et `crawl(source)`
3. Ajouter le bot dans `index.js` dans la map `bots`

Exemple :
```javascript
// bots/monBot.js
const initialCrawl = async (source) => {
  // Logique du crawl initial
  return { /* données */ };
};

const crawl = async (source) => {
  // Logique du crawl régulier
  return { /* données */ };
};

export default { initialCrawl, crawl };
```

```javascript
// bots/index.js
import monBot from './monBot.js';

const bots = {
  'azure-devops': azureDevOpsBot,
  'mon-type': monBot
};
```
