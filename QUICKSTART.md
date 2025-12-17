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

## Option 2 : Lancement en Mode Développement

Pour développer ou modifier le code localement.

### Prérequis

- Node.js 20+ installé
- MongoDB installé et démarré (ou utiliser Docker uniquement pour MongoDB)

### Étape 1 : Installer MongoDB (si pas déjà fait)

**Option A : Avec Docker (recommandé)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Option B : Installation locale**
- Téléchargez MongoDB depuis https://www.mongodb.com/try/download/community
- Démarrez le service MongoDB

### Étape 2 : Configurer l'environnement

```bash
# Copier le template
cp backend/.env.template backend/.env

# Éditer backend/.env et modifier si nécessaire :
# MONGODB_URI=mongodb://localhost:27017/chronicle
```

### Étape 3 : Installer les dépendances

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Étape 4 : Lancer les services

**Méthode 1 : Scripts automatiques**

Sur Windows (PowerShell) :
```powershell
.\scripts\start.ps1 dev
```

Sur Linux/Mac :
```bash
chmod +x scripts/start.sh
./scripts/start.sh dev
```

**Méthode 2 : Manuel (2 terminaux)**

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

---

## Option 3 : Lancement Mixte (MongoDB en Docker, App en local)

Parfait si vous voulez modifier le code rapidement sans reconstruire les images Docker.

### Étape 1 : Lancer uniquement MongoDB

```bash
docker-compose up -d mongodb
```

### Étape 2 : Configurer et lancer l'application

```bash
# Configurer
cp backend/.env.template backend/.env
# Modifier backend/.env : MONGODB_URI=mongodb://localhost:27017/chronicle

# Installer les dépendances
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Lancer (2 terminaux ou avec les scripts)
cd backend && npm run dev
cd frontend && npm run dev
```

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

