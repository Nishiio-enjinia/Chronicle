# 🔍 Recherche Sémantique avec @xenova/transformers

## Vue d'ensemble

Ce service utilise `@xenova/transformers` pour améliorer la recherche dans l'application avec de la recherche sémantique basée sur des embeddings. Au lieu de simplement chercher des correspondances textuelles exactes, le système comprend le sens des requêtes et trouve des résultats pertinents même si les mots ne correspondent pas exactement.

## Fonctionnalités

### 1. Recherche Sémantique (`semanticSearch`)
- Utilise des embeddings pour comprendre le sens des requêtes
- Combine recherche textuelle classique et recherche sémantique
- Calcule la similarité cosinus entre les embeddings
- Filtre les résultats selon un seuil de similarité

### 2. Recherche Intelligente (`smartSearch`)
- Active automatiquement la recherche sémantique pour les requêtes longues
- Utilise la recherche textuelle rapide pour les requêtes courtes
- Optimise les performances en choisissant la meilleure méthode

### 3. Suggestions (`generateSuggestions`)
- Génère des suggestions intelligentes basées sur la requête
- Aide les utilisateurs à trouver ce qu'ils cherchent plus rapidement

## Utilisation

### Dans un composant Vue

```vue
<script setup>
import { ref, watch } from 'vue';
import { smartSearch } from '../services/semanticSearch.js';

const items = ref([...]);
const searchQuery = ref('');
const results = ref([]);

watch([searchQuery, items], async ([query, itemsList]) => {
  if (!query) {
    results.value = itemsList;
    return;
  }
  
  results.value = await smartSearch(query, itemsList, {
    fields: ['name', 'displayName', 'description'],
    threshold: 0.3,
  });
});
</script>
```

### Options de recherche

```javascript
{
  fields: ['name', 'displayName'], // Champs à rechercher
  threshold: 0.3,                   // Seuil de similarité (0-1)
  limit: 10,                        // Nombre max de résultats
  useTextualSearch: true,           // Activer recherche textuelle
  minLengthForSemantic: 3           // Longueur min pour recherche sémantique
}
```

## Performance

- **Premier chargement** : Le modèle est chargé la première fois (peut prendre quelques secondes)
- **Recherches suivantes** : Très rapides grâce au cache
- **Modèle utilisé** : `Xenova/all-MiniLM-L6-v2` (léger et optimisé pour le navigateur)
- **Quantification** : Le modèle est quantifié pour réduire la taille

## Avantages

1. **Recherche plus intelligente** : Trouve des résultats même avec des mots différents
2. **Meilleure expérience utilisateur** : Suggestions et résultats plus pertinents
3. **Performance optimisée** : Combine recherche textuelle rapide et sémantique
4. **Fallback automatique** : Retombe sur la recherche textuelle en cas d'erreur

## Exemple

Recherche de "développement" trouvera aussi :
- "dev"
- "development"
- "développeur"
- "programmation"

Même si ces mots ne sont pas exactement dans les données.

## Notes

- Le modèle est chargé de manière lazy (seulement quand nécessaire)
- Les embeddings sont générés en temps réel
- Le cache du navigateur est utilisé pour améliorer les performances
- Compatible avec tous les navigateurs modernes
