/**
 * Service d'analyse IA pour détecter automatiquement les environnements et mots-clés
 * dans les logs de pipelines
 */

import PipelineLog from '../models/PipelineLog.js';
import AzureDevOpsPipeline from '../models/AzureDevOpsPipeline.js';

// Patterns communs pour détecter les environnements
// Ordre important : les patterns plus spécifiques en premier
const ENVIRONMENT_PATTERNS = [
  // Patterns très spécifiques d'abord (pour éviter les faux positifs)
  { pattern: /preprod|pre-prod|pre_prod/i, keyword: 'Preprod', priority: 1 },
  { pattern: /staging|stage/i, keyword: 'Staging', priority: 1 },
  { pattern: /development|develop/i, keyword: 'Development', priority: 1 },
  { pattern: /uat|user.*acceptance/i, keyword: 'UAT', priority: 1 },
  { pattern: /integration|int/i, keyword: 'Integration', priority: 1 },
  { pattern: /qa|quality.*assurance/i, keyword: 'QA', priority: 1 },
  { pattern: /test|testing/i, keyword: 'Test', priority: 1 },
  
  // Patterns spécifiques Azure DevOps
  { pattern: /release.*preprod|preprod.*release/i, keyword: 'Preprod', priority: 1 },
  { pattern: /release.*staging|staging.*release/i, keyword: 'Staging', priority: 1 },
  { pattern: /deploy.*preprod|preprod.*deploy/i, keyword: 'Preprod', priority: 1 },
  { pattern: /deploy.*staging|staging.*deploy/i, keyword: 'Staging', priority: 1 },
  
  // Production uniquement si très explicite (éviter les faux positifs)
  { pattern: /^production$|^prod$|production\s|production-|production_/i, keyword: 'Production', priority: 2 },
  { pattern: /release.*production|prod.*release/i, keyword: 'Production', priority: 2 },
  { pattern: /deploy.*production|production.*deploy/i, keyword: 'Production', priority: 2 },
  
  // Branches Git communes
  { pattern: /branch.*develop|branch.*dev/i, keyword: 'Development', priority: 1 },
  { pattern: /branch.*staging/i, keyword: 'Staging', priority: 1 },
  { pattern: /branch.*release/i, keyword: 'Staging', priority: 1 },
  { pattern: /branch.*main|branch.*master/i, keyword: 'Production', priority: 2 },
  
  // Patterns de noms de pipelines (plus spécifiques)
  { pattern: /^preprod|preprod$/i, keyword: 'Preprod', priority: 1 },
  { pattern: /^staging|staging$/i, keyword: 'Staging', priority: 1 },
  { pattern: /^dev|^develop|dev$|develop$/i, keyword: 'Development', priority: 1 },
];

// Mots-clés à exclure par défaut (trop génériques ou inutiles)
const EXCLUDED_KEYWORDS = ['Production']; // Production est trop générique et crée trop de faux positifs

/**
 * Analyse les logs pour détecter les environnements et mots-clés
 */
export async function analyzeKeywords(dataSourceId) {
  try {
    // Récupérer les logs récents (derniers 1000 logs)
    const logs = await PipelineLog.find({ dataSourceId })
      .sort({ date: -1 })
      .limit(1000)
      .lean();
    
    if (logs.length === 0) {
      return {
        keywordsFound: 0,
        keywords: [],
        message: 'Aucun log trouvé pour cette source de données'
      };
    }
    
    // Récupérer les pipelines pour avoir les noms complets
    const pipelines = await AzureDevOpsPipeline.find({ dataSourceId })
      .lean();
    
    const pipelineMap = new Map();
    pipelines.forEach(p => {
      pipelineMap.set(p.pipelineId, p);
    });
    
    // Détecter les mots-clés dans les logs
    const keywordMap = new Map();
    
    logs.forEach(log => {
      // Analyser le nom du pipeline
      const pipeline = pipelineMap.get(log.pipelineId);
      const pipelineName = pipeline?.name || log.pipelineName || '';
      
      // Analyser le nom du projet
      const projectName = log.projectName || '';
      
      // Analyser le message de commit
      const commitMessage = log.commitMessage || '';
      
      // Analyser la branche
      const branch = log.branch || '';
      
      // Analyser les logs
      const logsText = log.logs || '';
      
      // Combiner tous les textes à analyser
      const textToAnalyze = [
        pipelineName,
        projectName,
        commitMessage,
        branch,
        logsText
      ].join(' ').toLowerCase();
      
      // Appliquer les patterns par ordre de priorité (plus spécifiques d'abord)
      const matchedKeywords = new Set();
      const sortedPatterns = [...ENVIRONMENT_PATTERNS].sort((a, b) => (a.priority || 2) - (b.priority || 2));
      
      sortedPatterns.forEach(({ pattern, keyword }) => {
        // Ne pas traiter si déjà matché par un pattern plus spécifique
        if (matchedKeywords.has(keyword)) return;
        
        if (pattern.test(textToAnalyze)) {
          matchedKeywords.add(keyword);
          
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, {
              keyword,
              items: new Set(),
              confidence: 0
            });
          }
          
          const group = keywordMap.get(keyword);
          
          // Ajouter le pipeline/build à ce groupe (déjà dédupliqué par Set)
          const itemId = log.buildId || log.pipelineId;
          if (itemId) {
            group.items.add(itemId);
          }
          
          // Augmenter la confiance
          group.confidence += 1;
        }
      });
    });
    
    // Créer un map des builds/pipelines pour faciliter la recherche
    const buildMap = new Map();
    logs.forEach(log => {
      const buildId = log.buildId || log.pipelineId;
      if (buildId && !buildMap.has(buildId)) {
        const pipeline = pipelineMap.get(log.pipelineId);
        buildMap.set(buildId, {
          id: buildId,
          pipelineId: log.pipelineId,
          name: pipeline?.name || log.pipelineName || log.buildNumber || buildId,
          type: 'pipeline'
        });
      }
    });
    
    // Convertir en format de réponse et dédupliquer
    const keywords = Array.from(keywordMap.values())
      .map(group => {
        // Dédupliquer les items par ID et nom
        const itemsMap = new Map();
        Array.from(group.items).forEach(itemId => {
          const item = buildMap.get(itemId);
          if (item) {
            // Utiliser l'ID comme clé pour éviter les doublons
            if (!itemsMap.has(item.id)) {
              itemsMap.set(item.id, {
                id: item.id,
                name: item.name,
                type: item.type
              });
            }
          }
        });
        
        return {
          keyword: group.keyword,
          items: Array.from(itemsMap.values()),
          confidence: group.confidence
        };
      })
      .filter(k => {
        // Filtrer les groupes exclus
        if (EXCLUDED_KEYWORDS.includes(k.keyword)) {
          return false;
        }
        // Filtrer les groupes avec moins de 2 items (trop peu pour être utile)
        return k.items.length >= 2;
      })
      .sort((a, b) => b.confidence - a.confidence);
    
    // Détecter aussi les mots-clés déjà présents dans les logs
    const existingKeywords = new Set();
    logs.forEach(log => {
      if (log.keywords && Array.isArray(log.keywords)) {
        log.keywords.forEach(kw => {
          // Exclure les mots-clés génériques
          if (!EXCLUDED_KEYWORDS.includes(kw)) {
            existingKeywords.add(kw);
          }
        });
      }
    });
    
    // Ajouter les mots-clés existants qui ne sont pas déjà détectés
    existingKeywords.forEach(keyword => {
      // Ne pas ajouter si déjà détecté par les patterns
      if (keywordMap.has(keyword)) return;
      
      // Ne pas ajouter les mots-clés exclus
      if (EXCLUDED_KEYWORDS.includes(keyword)) return;
      
      const items = new Set();
      logs.forEach(log => {
        if (log.keywords && log.keywords.includes(keyword)) {
          const itemId = log.buildId || log.pipelineId;
          if (itemId) {
            items.add(itemId);
          }
        }
      });
      
      // Dédupliquer les items
      const itemsMap = new Map();
      Array.from(items).forEach(itemId => {
        const item = buildMap.get(itemId);
        if (item && !itemsMap.has(item.id)) {
          itemsMap.set(item.id, {
            id: item.id,
            name: item.name,
            type: item.type
          });
        }
      });
      
      // Ne garder que les groupes avec au moins 2 items
      if (itemsMap.size >= 2) {
        keywords.push({
          keyword,
          items: Array.from(itemsMap.values()),
          confidence: itemsMap.size
        });
      }
    });
    
    return {
      keywordsFound: keywords.length,
      keywords: keywords,
      logsAnalyzed: logs.length,
      message: `Analyse terminée : ${keywords.length} mots-clés détectés dans ${logs.length} logs`
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse des mots-clés:', error);
    throw error;
  }
}

/**
 * Analyse un texte pour détecter des environnements
 */
export function detectEnvironmentsInText(text) {
  if (!text) return [];
  
  const detected = new Set();
  const lowerText = text.toLowerCase();
  
  // Trier par priorité pour éviter les doublons
  const sortedPatterns = [...ENVIRONMENT_PATTERNS].sort((a, b) => (a.priority || 2) - (b.priority || 2));
  
  sortedPatterns.forEach(({ pattern, keyword }) => {
    // Ne pas ajouter si déjà détecté (priorité aux patterns plus spécifiques)
    if (detected.has(keyword)) return;
    
    // Ne pas ajouter les mots-clés exclus
    if (EXCLUDED_KEYWORDS.includes(keyword)) return;
    
    if (pattern.test(lowerText)) {
      detected.add(keyword);
    }
  });
  
  return Array.from(detected);
}

