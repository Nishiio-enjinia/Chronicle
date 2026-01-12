# 🔧 Guide de Dépannage - Chronicle

## Problème : Impossible de se connecter à MongoDB

### Symptômes
- Erreur `ECONNREFUSED` ou `connection timeout`
- Message `❌ MongoDB connection error` au démarrage du backend

### Solution rapide

1. **Vérifier que MongoDB est lancé**
```bash
# Vérifier le statut
docker ps | grep chronicle-mongodb

# Si pas lancé, le démarrer
npm run start:db:detached
```

2. **Vérifier la configuration dans `backend/.env`**

Ouvrez `backend/.env` et assurez-vous que :
```env
MONGODB_URI=mongodb://localhost:27017/chronicle
```

**⚠️ IMPORTANT** : Si vous voyez `mongodb://mongodb:27017/chronicle`, changez-le en `mongodb://localhost:27017/chronicle`

Le nom `mongodb` fonctionne uniquement dans Docker Compose quand le backend est aussi dans Docker. Pour le développement local, utilisez `localhost`.

3. **Tester la connexion**
```bash
npm run check:db
```

Cette commande va tester la connexion et afficher des informations utiles.

### Vérifications étape par étape

#### Étape 1 : MongoDB est-il lancé ?
```bash
# Vérifier avec Docker
docker ps -a | grep chronicle-mongodb

# Vérifier le port
netstat -an | findstr 27017  # Windows
netstat -an | grep 27017     # Linux/Mac
```

#### Étape 2 : Le fichier .env est-il correct ?

Créez ou modifiez `backend/.env` :
```bash
# Copier le template
cp backend/env.template backend/.env
```

Puis éditez `backend/.env` et vérifiez :
```env
MONGODB_URI=mongodb://localhost:27017/chronicle
```

#### Étape 3 : Tester la connexion manuellement

```bash
# Avec le script de vérification
npm run check:db

# Ou directement avec mongosh (si installé)
mongosh mongodb://localhost:27017/chronicle
```

### Erreurs courantes

#### `ECONNREFUSED`
- **Cause** : MongoDB n'est pas lancé ou le port est incorrect
- **Solution** : `npm run start:db:detached`

#### `Connection timeout`
- **Cause** : MongoDB ne répond pas ou firewall bloque
- **Solution** : Vérifier que le port 27017 est accessible

#### `authentication failed`
- **Cause** : Identifiants incorrects dans MONGODB_URI
- **Solution** : Vérifier le format de l'URI (sans authentification par défaut)

### Commandes utiles

```bash
# Lancer MongoDB
npm run start:db:detached

# Arrêter MongoDB
npm run stop:db

# Voir les logs MongoDB
docker logs chronicle-mongodb

# Vérifier la connexion
npm run check:db

# Redémarrer MongoDB
npm run stop:db && npm run start:db:detached
```

### Configuration recommandée pour le développement

Dans `backend/.env` :
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chronicle
CORS_ORIGIN=http://localhost:5173
```

### Besoin d'aide supplémentaire ?

1. Vérifiez les logs du backend : `cd backend && npm run dev`
2. Vérifiez les logs MongoDB : `docker logs chronicle-mongodb`
3. Testez la connexion : `npm run check:db`
