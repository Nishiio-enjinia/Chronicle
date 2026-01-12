# 📋 Chronicle

Application web de gestion centralisée des changelogs. Chronicle automatise la collecte des builds via n8n, stocke et affiche les changelogs par site et application avec une interface utilisateur moderne et un back office complet.

## 🎯 Fonctionnalités

- **Collecte automatique** : Intégration avec n8n pour récupérer les changelogs depuis les pipelines
- **Gestion manuelle** : Back office pour ajouter des événements manuels (maintenances, interventions)
- **Filtres avancés** : Filtrage par site, application, dates, types d'événements
- **Interface moderne** : Design responsive avec Vue 3 et UX optimisée
- **API REST complète** : CRUD complet pour changelogs et événements
- **Containerisé** : Déploiement facile avec Docker Compose

## 🛠️ Tech Stack

### Backend
- **Node.js** avec Express
- **MongoDB** (ou SQLite pour déploiement léger)
- **REST API** avec validation des données

### Frontend
- **Vue 3** avec Composition API
- **Pinia** pour la gestion d'état
- **Vue Router** pour la navigation
- **Vite** pour le build et le développement
- **Design responsive** et moderne

### Infrastructure
- **Docker** et **Docker Compose** pour l'orchestration
- **MongoDB** en conteneur
- Architecture microservices

## 📦 Installation

### Prérequis

- Docker et Docker Compose installés
- Node.js 20+ (pour le développement local)
- MongoDB (si utilisation sans Docker)

### Installation avec Docker (Recommandé)

1. **Cloner le repository**
```bash
git clone <repository-url>
cd Chronicle
```

2. **Configurer les variables d'environnement**

Copiez le fichier template et configurez-le :
```bash
cp backend/env.template backend/.env
```

Éditez `backend/.env` selon vos besoins :
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/chronicle
CORS_ORIGIN=http://localhost:5173
```

3. **Lancer avec Docker Compose**
```bash
docker-compose up -d
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **MongoDB** : localhost:27017

### Installation pour le développement

#### Prérequis

- Node.js 20+ installé
- Docker (uniquement pour MongoDB)

#### Étapes

1. **Lancer MongoDB avec Docker**
```bash
docker-compose -f docker-compose.dev-db.yml up -d
```

2. **Installer les dépendances**
```bash
# À la racine
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

3. **Configurer l'environnement**
```bash
cp backend/env.template backend/.env
# Le fichier .env est déjà configuré pour localhost
```

4. **Lancer le développement**
```bash
# À la racine - lance frontend et backend ensemble
npm run dev
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **MongoDB** : localhost:27017

**Commandes disponibles :**
- `npm run dev` - Lance frontend et backend ensemble
- `npm run dev:backend` - Lance uniquement le backend
- `npm run dev:frontend` - Lance uniquement le frontend
- `npm run start:db` - Lance MongoDB
- `npm run start:db:detached` - Lance MongoDB en arrière-plan
- `npm run stop:db` - Arrête MongoDB

## 🚀 Utilisation

### Interface Utilisateur

1. **Page Changelogs** (`/`) : Visualisez tous les changelogs avec filtres avancés
2. **Page Événements** (`/events`) : Consultez les maintenances et interventions
3. **Back Office** (`/admin`) : Ajoutez des événements et changelogs manuels

### API REST

#### Changelogs

- `GET /api/changelogs` - Liste tous les changelogs (avec filtres)
- `GET /api/changelogs/:id` - Récupère un changelog spécifique
- `POST /api/changelogs` - Crée un nouveau changelog
- `PUT /api/changelogs/:id` - Met à jour un changelog
- `DELETE /api/changelogs/:id` - Supprime un changelog
- `GET /api/changelogs/stats/summary` - Statistiques globales

#### Événements

- `GET /api/events` - Liste tous les événements (avec filtres)
- `GET /api/events/:id` - Récupère un événement spécifique
- `POST /api/events` - Crée un nouvel événement
- `PUT /api/events/:id` - Met à jour un événement
- `DELETE /api/events/:id` - Supprime un événement

#### Sites et Applications

- `GET /api/sites` - Liste tous les sites
- `GET /api/sites/:site/stats` - Statistiques d'un site
- `GET /api/applications` - Liste toutes les applications
- `GET /api/applications/:application/stats` - Statistiques d'une application

### Intégration n8n

Pour intégrer n8n avec Chronicle, configurez un webhook dans n8n qui envoie les données au format suivant :

```json
{
  "site": "production",
  "application": "mon-app",
  "version": "1.2.3",
  "buildNumber": "123",
  "changes": [
    {
      "type": "feature",
      "description": "Nouvelle fonctionnalité ajoutée"
    },
    {
      "type": "fix",
      "description": "Correction d'un bug"
    }
  ],
  "buildDate": "2025-01-15T10:30:00Z",
  "source": "n8n",
  "metadata": {
    "pipelineId": "pipeline-123",
    "commitHash": "abc123",
    "branch": "main",
    "author": "John Doe"
  }
}
```

Ensuite, faites un POST vers : `http://votre-serveur:3000/api/changelogs`

## 📁 Structure du Projet

```
Chronicle/
├── backend/                 # API Node.js/Express
│   ├── config/             # Configuration (database, etc.)
│   ├── models/             # Modèles Mongoose
│   ├── routes/             # Routes API
│   ├── server.js           # Point d'entrée
│   └── package.json
├── frontend/               # Application Vue 3
│   ├── src/
│   │   ├── api/           # Client API
│   │   ├── stores/        # Stores Pinia
│   │   ├── views/         # Vues principales
│   │   ├── router/        # Configuration router
│   │   ├── App.vue        # Composant racine
│   │   └── main.js        # Point d'entrée
│   ├── index.html
│   └── package.json
├── docker-compose.yml      # Configuration Docker Compose
├── LICENSE                 # Licence MIT
└── README.md              # Documentation
```

## 🔧 Configuration

### Variables d'environnement Backend

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur API | `3000` |
| `NODE_ENV` | Environnement (development/production) | `development` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://mongodb:27017/chronicle` |
| `CORS_ORIGIN` | Origine autorisée pour CORS | `http://localhost:5173` |
| `N8N_WEBHOOK_URL` | URL du webhook n8n | - |

### Types de changements

- `feature` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `update` : Mise à jour
- `security` : Correctif de sécurité
- `breaking` : Changement majeur (breaking change)

### Types d'événements

- `maintenance` : Maintenance planifiée
- `intervention` : Intervention technique
- `incident` : Incident
- `announcement` : Annonce

## 🧪 Développement

### Scripts disponibles

**Backend :**
```bash
npm start      # Démarre le serveur en production
npm run dev    # Démarre avec nodemon (hot reload)
```

**Frontend :**
```bash
npm run dev    # Démarre le serveur de développement
npm run build  # Build pour production
npm run preview # Prévisualise le build
```

### Tests

Les tests sont à implémenter selon vos besoins. Structure recommandée :
- Tests unitaires avec Jest/Vitest
- Tests d'intégration pour l'API
- Tests E2E pour le frontend

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👤 Auteur

**Alexandre MALAISE**

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository GitHub.

---

**Chronicle** - Gestion centralisée des changelogs 🚀
