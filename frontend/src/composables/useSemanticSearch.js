/**
 * Composable Vue pour la recherche sémantique
 * Facilite l'intégration de la recherche améliorée dans les composants
 */

import { ref, computed, watch } from 'vue';
import { semanticSearch, smartSearch, generateSuggestions } from '../services/semanticSearch.js';

/**
 * Composable pour la recherche sémantique
 */
export function useSemanticSearch(items, options = {}) {
  const {
    fields = ['name', 'displayName', 'description'],
    threshold = 0.3,
    debounceMs = 300,
    enableSuggestions = true,
    maxSuggestions = 5,
  } = options;

  const query = ref('');
  const isSearching = ref(false);
  const suggestions = ref([]);
  const results = ref([]);
  const error = ref(null);

  let debounceTimer = null;

  /**
   * Effectue la recherche avec debounce
   */
  const performSearch = async (searchQuery) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        results.value = items.value || [];
        suggestions.value = [];
        return;
      }

      isSearching.value = true;
      error.value = null;

      try {
        // Recherche principale
        const searchResults = await smartSearch(searchQuery, items.value || [], {
          fields,
          threshold,
        });
        results.value = searchResults;

        // Générer des suggestions si activé
        if (enableSuggestions && searchQuery.length >= 2) {
          const searchSuggestions = await generateSuggestions(searchQuery, items.value || [], {
            maxSuggestions,
            fields,
          });
          suggestions.value = searchSuggestions;
        }
      } catch (err) {
        console.error('Erreur lors de la recherche:', err);
        error.value = err.message || 'Erreur lors de la recherche';
        // Fallback sur les items originaux
        results.value = items.value || [];
      } finally {
        isSearching.value = false;
      }
    }, debounceMs);
  };

  // Watcher pour déclencher la recherche automatiquement
  watch(query, (newQuery) => {
    performSearch(newQuery);
  });

  // Initialiser avec les items par défaut
  watch(
    () => items.value,
    (newItems) => {
      if (!query.value || query.value.trim().length === 0) {
        results.value = newItems || [];
      }
    },
    { immediate: true }
  );

  /**
   * Réinitialise la recherche
   */
  const reset = () => {
    query.value = '';
    results.value = items.value || [];
    suggestions.value = [];
    error.value = null;
  };

  /**
   * Sélectionne une suggestion
   */
  const selectSuggestion = (suggestion) => {
    query.value = suggestion;
    suggestions.value = [];
  };

  return {
    query,
    results: computed(() => results.value),
    suggestions: computed(() => suggestions.value),
    isSearching: computed(() => isSearching.value),
    error: computed(() => error.value),
    performSearch,
    reset,
    selectSuggestion,
  };
}

/**
 * Composable simplifié pour la recherche rapide
 * Note: Utilisez directement smartSearch dans les composants pour de meilleures performances
 */
export function useQuickSearch(items, searchFields = ['name', 'displayName']) {
  const searchQuery = ref('');
  const isSearching = ref(false);
  const filteredItems = ref([]);

  let debounceTimer = null;

  const performSearch = async () => {
    if (!searchQuery.value || searchQuery.value.trim().length === 0) {
      filteredItems.value = items.value || [];
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      isSearching.value = true;
      try {
        const results = await smartSearch(searchQuery.value, items.value || [], {
          fields: searchFields,
          threshold: 0.25,
        });
        filteredItems.value = results;
      } catch (error) {
        console.error('Erreur lors de la recherche rapide:', error);
        // Fallback sur recherche textuelle simple
        const query = searchQuery.value.toLowerCase();
        filteredItems.value = (items.value || []).filter(item =>
          searchFields.some(field => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(query);
          })
        );
      } finally {
        isSearching.value = false;
      }
    }, 300);
  };

  watch(searchQuery, performSearch);
  watch(items, () => {
    if (!searchQuery.value) {
      filteredItems.value = items.value || [];
    }
  }, { immediate: true });

  return {
    searchQuery,
    filteredItems: computed(() => filteredItems.value),
    isSearching: computed(() => isSearching.value),
  };
}
