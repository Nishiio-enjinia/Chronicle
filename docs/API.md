# Documentation API Chronicle

## Base URL

```
http://localhost:3000/api
```

## Authentification

Actuellement, l'API ne nécessite pas d'authentification. Pour la production, il est recommandé d'ajouter un système d'authentification (JWT, OAuth, etc.).

## Endpoints

### Changelogs

#### GET /changelogs

Récupère la liste des changelogs avec filtres optionnels.

**Query Parameters :**
- `site` (string, optionnel) : Filtrer par site
- `application` (string, optionnel) : Filtrer par application
- `startDate` (ISO 8601, optionnel) : Date de début
- `endDate` (ISO 8601, optionnel) : Date de fin
- `source` (string, optionnel) : `n8n` ou `manual`
- `page` (number, optionnel) : Numéro de page (défaut: 1)
- `limit` (number, optionnel) : Nombre d'éléments par page (défaut: 20, max: 100)

**Exemple :**
```bash
GET /api/changelogs?site=production&application=mon-app&page=1&limit=20
```

**Réponse :**
```json
{
  "data": [
    {
      "_id": "...",
      "site": "production",
      "application": "mon-app",
      "version": "1.2.3",
      "buildNumber": "123",
      "changes": [
        {
          "type": "feature",
          "description": "Nouvelle fonctionnalité"
        }
      ],
      "buildDate": "2025-01-15T10:30:00.000Z",
      "source": "n8n",
      "metadata": {},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /changelogs

Crée un nouveau changelog.

**Body :**
```json
{
  "site": "production",
  "application": "mon-app",
  "version": "1.2.3",
  "buildNumber": "123",
  "changes": [
    {
      "type": "feature",
      "description": "Nouvelle fonctionnalité"
    }
  ],
  "buildDate": "2025-01-15T10:30:00Z",
  "source": "manual",
  "metadata": {
    "pipelineId": "pipeline-123",
    "commitHash": "abc123",
    "branch": "main",
    "author": "John Doe"
  }
}
```

### Événements

#### GET /events

Récupère la liste des événements avec filtres optionnels.

**Query Parameters :**
- `site` (string, optionnel)
- `application` (string, optionnel)
- `type` (string, optionnel) : `maintenance`, `intervention`, `incident`, `announcement`
- `status` (string, optionnel) : `scheduled`, `in-progress`, `completed`, `cancelled`
- `startDate` (ISO 8601, optionnel)
- `endDate` (ISO 8601, optionnel)
- `page` (number, optionnel)
- `limit` (number, optionnel)

#### POST /events

Crée un nouvel événement.

**Body :**
```json
{
  "title": "Maintenance planifiée",
  "description": "Maintenance du serveur de production",
  "type": "maintenance",
  "site": "production",
  "application": "mon-app",
  "startDate": "2025-01-20T02:00:00Z",
  "endDate": "2025-01-20T04:00:00Z",
  "status": "scheduled",
  "impact": "medium",
  "createdBy": "admin"
}
```

## Codes de réponse

- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de validation
- `404` : Ressource non trouvée
- `500` : Erreur serveur


