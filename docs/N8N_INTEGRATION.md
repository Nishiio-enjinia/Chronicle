# Intégration n8n avec Chronicle

Ce guide explique comment configurer n8n pour envoyer automatiquement les changelogs à Chronicle.

## Configuration du Webhook n8n

### 1. Créer un workflow dans n8n

1. Ouvrez n8n et créez un nouveau workflow
2. Ajoutez un nœud **Webhook** comme déclencheur
3. Configurez le webhook :
   - **HTTP Method** : POST
   - **Path** : `/chronicle` (ou votre chemin personnalisé)
   - **Response Mode** : Respond to Webhook

### 2. Traiter les données du pipeline

Ajoutez des nœuds pour transformer les données de votre pipeline CI/CD en format Chronicle :

**Exemple de transformation :**

```javascript
// Dans un nœud Code ou Function
const buildData = $input.item.json;

return {
  site: buildData.site || "production",
  application: buildData.application,
  version: buildData.version,
  buildNumber: buildData.buildNumber || buildData.build_id,
  changes: buildData.changes || parseChangelog(buildData.changelog),
  buildDate: buildData.buildDate || new Date().toISOString(),
  source: "n8n",
  metadata: {
    pipelineId: buildData.pipelineId,
    commitHash: buildData.commitHash,
    branch: buildData.branch,
    author: buildData.author
  }
};
```

### 3. Envoyer à l'API Chronicle

Ajoutez un nœud **HTTP Request** :

- **Method** : POST
- **URL** : `http://votre-serveur-chronicle:3000/api/changelogs`
- **Authentication** : None (ou ajoutez une authentification si configurée)
- **Body** : JSON avec les données transformées

### 4. Gestion des erreurs

Ajoutez un nœud **IF** pour gérer les erreurs :

- Si le statut HTTP est 200-299 : Succès
- Sinon : Envoyer une notification (email, Slack, etc.)

## Exemple de payload

Voici un exemple de payload que n8n peut envoyer :

```json
{
  "site": "production",
  "application": "mon-application",
  "version": "1.2.3",
  "buildNumber": "123",
  "changes": [
    {
      "type": "feature",
      "description": "Ajout de la fonctionnalité de recherche avancée"
    },
    {
      "type": "fix",
      "description": "Correction du bug d'affichage sur mobile"
    },
    {
      "type": "update",
      "description": "Mise à jour des dépendances"
    }
  ],
  "buildDate": "2025-01-15T10:30:00Z",
  "source": "n8n",
  "metadata": {
    "pipelineId": "pipeline-abc123",
    "commitHash": "a1b2c3d4e5f6",
    "branch": "main",
    "author": "John Doe"
  }
}
```

## Types de changements supportés

- `feature` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `update` : Mise à jour
- `security` : Correctif de sécurité
- `breaking` : Changement majeur (breaking change)

## Parsing automatique du changelog

Si votre pipeline génère un changelog au format Markdown ou texte, vous pouvez le parser automatiquement :

```javascript
function parseChangelog(changelogText) {
  const changes = [];
  const lines = changelogText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('feat:')) {
      changes.push({
        type: 'feature',
        description: line.replace('feat:', '').trim()
      });
    } else if (line.startsWith('fix:')) {
      changes.push({
        type: 'fix',
        description: line.replace('fix:', '').trim()
      });
    }
    // Ajoutez d'autres patterns selon votre format
  }
  
  return changes;
}
```

## Test du workflow

1. Utilisez le bouton "Test workflow" dans n8n
2. Vérifiez que les données sont correctement formatées
3. Vérifiez dans Chronicle que le changelog apparaît bien

## Sécurité

Pour la production, il est recommandé :

1. **Authentification** : Ajoutez un token d'authentification dans les headers
2. **Validation** : Validez les données avant l'envoi
3. **Rate limiting** : Configurez un rate limiting dans Chronicle
4. **HTTPS** : Utilisez HTTPS pour toutes les communications

## Exemple de workflow complet

```
[Webhook] → [Transform Data] → [HTTP Request] → [IF Error] → [Notification]
```

1. **Webhook** : Reçoit les données du pipeline
2. **Transform Data** : Transforme en format Chronicle
3. **HTTP Request** : Envoie à l'API Chronicle
4. **IF Error** : Vérifie le statut de la réponse
5. **Notification** : Envoie une alerte en cas d'erreur


