# 🚀 Guide de Démarrage Rapide - Chronicle

## Option 1 : Lancement avec Docker (Recommandé) ⭐

C'est la méthode la plus simple et la plus rapide !

### Étape 1 : Préparer la configuration

```bash
# Copier le template d'environnement
cp backend/env.template backend/.env
```

Le fichier `.env` est déjà configuré pour Docker, vous n'avez normalement rien à modifier.

### Étape 2 : Lancer avec Docker Compose

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Étape 3 : Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **Health Check** : http://localhost:3000/api/health

### Commandes utiles Docker

```bash
# Voir l'état des conteneurs
docker-compose ps

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Redémarrer un service
docker-compose restart backend

# Reconstruire les images
docker-compose build

# Arrêter et supprimer tout (y compris les volumes)
docker-compose down -v
```

---

## Option 2 : Lancement en Mode Développement (Recommandé pour le dev) ⚡

Pour développer ou modifier le code localement avec hot-reload automatique.

### Prérequis

- Node.js 20+ installé
- Docker (uniquement pour MongoDB)

### Étape 1 : Lancer MongoDB avec Docker

```bash
# Lancer uniquement MongoDB
docker-compose -f docker-compose.dev-db.yml up -d

# Ou en mode attaché pour voir les logs
docker-compose -f docker-compose.dev-db.yml up
```

### Étape 2 : Configurer l'environnement

```bash
# Copier le template
cp backend/env.template backend/.env

# Le fichier .env est déjà configuré pour localhost par défaut
# MONGODB_URI=mongodb://localhost:27017/chronicle
```

### Étape 3 : Installer les dépendances

```bash
# Installer les dépendances à la racine (concurrently)
npm install

# Installer les dépendances du backend
cd backend
npm install
cd ..

# Installer les dépendances du frontend
cd frontend
npm install
cd ..
```

### Étape 4 : Lancer les services

**Méthode recommandée : Une seule commande** 🚀

```bash
# À la racine du projet
npm run dev
```

Cette commande lance automatiquement :
- Le backend avec nodemon (hot-reload)
- Le frontend avec Vite (hot-reload)

**Méthode alternative : Lancer séparément**

Terminal 1 - Backend :
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend :
```bash
cd frontend
npm run dev
```

### Étape 5 : Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000

### Commandes utiles

```bash
# Lancer MongoDB en arrière-plan
npm run start:db:detached

# Arrêter MongoDB
npm run stop:db

# Lancer uniquement le backend
npm run dev:backend

# Lancer uniquement le frontend
npm run dev:frontend
```

---

## Option 3 : Lancement Mixte (MongoDB en Docker, App en local)

⚠️ **Cette option est maintenant intégrée dans l'Option 2**. Utilisez plutôt l'Option 2 qui est plus simple et plus rapide.

---

## 🔍 Vérification que tout fonctionne

### 1. Vérifier l'API Backend

```bash
# Test de santé
curl http://localhost:3000/api/health

# Devrait retourner :
# {"status":"ok","message":"Chronicle API is running"}
```

### 2. Vérifier MongoDB

```bash
# Si MongoDB est en Docker
docker exec -it chronicle-mongodb mongosh

# Dans mongosh :
use chronicle
show collections
```

### 3. Tester l'API

```bash
# Créer un changelog de test
curl -X POST http://localhost:3000/api/changelogs \
  -H "Content-Type: application/json" \
  -d '{
    "site": "test",
    "application": "test-app",
    "version": "1.0.0",
    "buildNumber": "1",
    "changes": [
      {
        "type": "feature",
        "description": "Test de fonctionnement"
      }
    ]
  }'

# Récupérer les changelogs
curl http://localhost:3000/api/changelogs
```

### 4. Vérifier le Frontend

Ouvrez http://localhost:5173 dans votre navigateur. Vous devriez voir :
- La page des Changelogs
- Les filtres fonctionnels
- La navigation entre les pages

---

## 🐛 Dépannage

### Problème : Le backend ne démarre pas

```bash
# Vérifier que MongoDB est accessible
docker-compose ps mongodb

# Vérifier les logs
docker-compose logs backend

# Vérifier le fichier .env
cat backend/.env
```

### Problème : Le frontend ne se connecte pas à l'API

```bash
# Vérifier que le backend tourne
curl http://localhost:3000/api/health

# Vérifier la configuration CORS dans backend/.env
# CORS_ORIGIN=http://localhost:5173
```

### Problème : MongoDB ne démarre pas

```bash
# Vérifier les logs
docker-compose logs mongodb

# Vérifier si le port 27017 est déjà utilisé
netstat -an | grep 27017  # Linux/Mac
netstat -an | findstr 27017  # Windows
```

### Problème : Port déjà utilisé

Si le port 3000 ou 5173 est déjà utilisé :

**Backend** : Modifier `PORT` dans `backend/.env`
**Frontend** : Modifier le port dans `frontend/vite.config.js`

---

## 📝 Prochaines étapes

Une fois l'application lancée :

1. **Explorer l'interface** : http://localhost:5173
2. **Ajouter un événement manuel** : Aller dans "Back Office"
3. **Tester les filtres** : Utiliser les filtres sur la page Changelogs
4. **Configurer n8n** : Voir `docs/N8N_INTEGRATION.md`

---

## 🎯 Résumé des URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Interface utilisateur |
| Backend API | http://localhost:3000 | API REST |
| Health Check | http://localhost:3000/api/health | Vérification de l'API |
| MongoDB | localhost:27017 | Base de données |

---

**Besoin d'aide ?** Consultez le [README.md](README.md) principal ou ouvrez une issue sur GitHub.

