# 🚀 DÉMARRAGE RAPIDE - Chronicle

## Méthode la plus simple (Docker) ⭐

### 1. Créer le fichier de configuration

```bash
# Windows (PowerShell)
Copy-Item backend\env.template backend\.env

# Linux/Mac
cp backend/env.template backend/.env
```

### 2. Lancer avec Docker Compose

```bash
docker-compose up -d
```

### 3. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api/health

---

## Commandes rapides

### Avec Make (Linux/Mac)

```bash
make start    # Démarrer
make dev      # Mode développement
make stop     # Arrêter
make logs     # Voir les logs
make clean    # Tout nettoyer
```

### Avec Docker Compose

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart
```

### Avec les scripts

**Windows :**
```powershell
.\MAKE.bat prod    # Production
.\MAKE.bat dev     # Développement
.\MAKE.bat stop    # Arrêter
```

**Linux/Mac :**
```bash
./scripts/start.sh prod
./scripts/start.sh dev
```

---

## Vérification

Testez que tout fonctionne :

```bash
# Test de l'API
curl http://localhost:3000/api/health

# Devrait retourner :
# {"status":"ok","message":"Chronicle API is running"}
```

Ouvrez http://localhost:5173 dans votre navigateur !

---

📖 Pour plus de détails, consultez [QUICKSTART.md](QUICKSTART.md)


