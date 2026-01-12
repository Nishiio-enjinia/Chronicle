/**
 * Service de recherche sémantique améliorée avec @xenova/transformers
 * Utilise des embeddings pour améliorer la recherche et les suggestions
 */

import { pipeline, env } from '@xenova/transformers';

// Configuration pour utiliser les modèles en cache local
env.allowLocalModels = true;
env.useBrowserCache = true;

let embeddingPipeline = null;
let isInitializing = false;

/**
 * Initialise le pipeline d'embeddings (lazy loading)
 */
const initializeEmbeddings = async () => {
  if (embeddingPipeline) return embeddingPipeline;
  if (isInitializing) {
    // Attendre que l'initialisation soit terminée
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return embeddingPipeline;
  }

  isInitializing = true;
  try {
    // Utiliser un modèle d'embeddings multilingue léger
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2', // Modèle léger et rapide
      {
        quantized: true, // Utiliser la version quantifiée pour réduire la taille
      }
    );
    console.log('✅ Modèle d\'embeddings chargé');
  } catch (error) {
    console.error('❌ Erreur lors du chargement du modèle:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
  return embeddingPipeline;
};

/**
 * Génère un embedding pour un texte
 */
const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') return null;
  
  try {
    const pipeline = await initializeEmbeddings();
    const result = await pipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(result.data);
  } catch (error) {
    console.error('Erreur lors de la génération d\'embedding:', error);
    return null;
  }
};

/**
 * Calcule la similarité cosinus entre deux embeddings
 */
const cosineSimilarity = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
};

/**
 * Recherche sémantique améliorée
 * Combine recherche textuelle classique et recherche sémantique
 */
export const semanticSearch = async (query, items, options = {}) => {
  const {
    fields = ['name', 'displayName', 'description'], // Champs à rechercher
    threshold = 0.3, // Seuil de similarité minimum
    limit = null, // Limite de résultats (null = pas de limite)
    useTextualSearch = true, // Utiliser aussi la recherche textuelle classique
  } = options;

  if (!query || query.trim().length === 0) {
    return items;
  }

  const queryLower = query.toLowerCase().trim();
  
  // Recherche textuelle classique (rapide)
  let textResults = [];
  if (useTextualSearch) {
    textResults = items.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (!value) return false;
        return String(value).toLowerCase().includes(queryLower);
      });
    });
  }

  // Si la recherche textuelle donne des résultats et que la requête est courte,
  // on peut se contenter de ça pour des performances optimales
  if (textResults.length > 0 && query.length < 3) {
    return limit ? textResults.slice(0, limit) : textResults;
  }

  // Recherche sémantique (plus lente mais plus intelligente)
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      // Fallback sur recherche textuelle si l'embedding échoue
      return limit ? textResults.slice(0, limit) : textResults;
    }

    // Générer des embeddings pour tous les items (avec cache si possible)
    const itemsWithScores = await Promise.all(
      items.map(async (item) => {
        // Créer un texte combiné de tous les champs pertinents
        const itemText = fields
          .map(field => item[field])
          .filter(Boolean)
          .join(' ');

        if (!itemText) {
          return { item, score: 0, isTextMatch: false };
        }

        // Vérifier d'abord si c'est une correspondance textuelle exacte
        const isTextMatch = fields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(queryLower);
        });

        // Générer l'embedding pour l'item
        const itemEmbedding = await generateEmbedding(itemText);
        if (!itemEmbedding) {
          return { item, score: isTextMatch ? 1 : 0, isTextMatch };
        }

        // Calculer la similarité
        const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
        
        // Bonus pour les correspondances textuelles
        const finalScore = isTextMatch 
          ? Math.max(similarity, 0.8) + 0.1 
          : similarity;

        return { item, score: finalScore, isTextMatch };
      })
    );

    // Filtrer et trier par score
    let results = itemsWithScores
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => {
        // Prioriser les correspondances textuelles
        if (a.isTextMatch && !b.isTextMatch) return -1;
        if (!a.isTextMatch && b.isTextMatch) return 1;
        return b.score - a.score;
      })
      .map(({ item, score }) => ({ ...item, _similarityScore: score }));

    // Combiner avec les résultats textuels si nécessaire
    if (useTextualSearch && textResults.length > 0) {
      const textResultIds = new Set(textResults.map(r => r._id || r.id));
      const semanticOnly = results.filter(r => !textResultIds.has(r._id || r.id));
      results = [...textResults, ...semanticOnly];
    }

    return limit ? results.slice(0, limit) : results;
  } catch (error) {
    console.error('Erreur lors de la recherche sémantique:', error);
    // Fallback sur recherche textuelle
    return limit ? textResults.slice(0, limit) : textResults;
  }
};

/**
 * Recherche rapide avec fallback textuel
 * Utilise la recherche sémantique uniquement si la requête est suffisamment longue
 */
export const smartSearch = async (query, items, options = {}) => {
  const {
    minLengthForSemantic = 3, // Longueur minimale pour activer la recherche sémantique
    ...searchOptions
  } = options;

  // Pour les requêtes courtes, utiliser uniquement la recherche textuelle
  if (query.length < minLengthForSemantic) {
    return semanticSearch(query, items, {
      ...searchOptions,
      useTextualSearch: true,
    });
  }

  // Pour les requêtes plus longues, utiliser la recherche sémantique
  return semanticSearch(query, items, searchOptions);
};

/**
 * Génère des suggestions intelligentes basées sur la requête
 */
export const generateSuggestions = async (query, items, options = {}) => {
  const {
    maxSuggestions = 5,
    fields = ['name', 'displayName'],
  } = options;

  if (!query || query.length < 2) {
    return [];
  }

  try {
    const results = await smartSearch(query, items, {
      ...options,
      limit: maxSuggestions * 2, // Prendre plus de résultats pour filtrer
    });

    // Extraire les suggestions uniques
    const suggestions = new Set();
    results.forEach(item => {
      fields.forEach(field => {
        const value = item[field];
        if (value && String(value).toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(String(value));
        }
      });
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
  } catch (error) {
    console.error('Erreur lors de la génération de suggestions:', error);
    return [];
  }
};

/**
 * Préchauffe le modèle (utile pour améliorer les performances)
 */
export const preloadModel = async () => {
  try {
    await initializeEmbeddings();
    console.log('✅ Modèle préchargé');
  } catch (error) {
    console.warn('⚠️ Impossible de précharger le modèle:', error);
  }
};
