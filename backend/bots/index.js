/**
 * Système de gestion des bots/crawlers pour les sources de données
 * Chaque bot est responsable du crawl d'un type de source spécifique
 */

import cron from 'node-cron';
import { connectDB } from '../config/database.js';
import DataSource from '../models/DataSource.js';
import azureDevOpsBot from './azureDevOpsBot.js';

// Map des bots disponibles par type de source
const bots = {
  'azure-devops': azureDevOpsBot
  // Ajouter d'autres bots ici : 'n8n', 'api', etc.
};

/**
 * Initialise et démarre tous les bots actifs
 */
export const initializeBots = async () => {
  try {
    await connectDB();
    console.log('🤖 Initialisation des bots...');
    
    const activeSources = await DataSource.find({ isActive: true });
    
    if (activeSources.length === 0) {
      console.log('ℹ️  Aucune source active trouvée');
      return;
    }
    
    for (const source of activeSources) {
      const bot = bots[source.type];
      
      if (!bot) {
        console.warn(`⚠️  Aucun bot disponible pour le type: ${source.type}`);
        continue;
      }
      
      // Vérifier si le crawl initial a été effectué
      if (!source.initialCrawlCompleted) {
        console.log(`⚠️  Source "${source.name}" : le crawl initial n'a pas encore été effectué. Les crawls automatiques ne seront pas planifiés.`);
        continue;
      }
      
      if (source.schedule && source.schedule.days && source.schedule.hours) {
        // Planifier le bot selon le schedule
        scheduleBot(source, bot);
      } else {
        console.log(`ℹ️  Source "${source.name}" n'a pas de planification configurée`);
      }
    }
    
    console.log('✅ Bots initialisés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des bots:', error);
  }
};

/**
 * Planifie un bot selon son schedule
 */
const scheduleBot = (source, bot) => {
  const { days, hours, timezone } = source.schedule;
  
  // Créer une expression cron pour chaque heure planifiée
  for (const hour of hours) {
    // Convertir les jours en format cron (0-6, dimanche = 0)
    const cronDays = days.join(',');
    
    // Format cron: minute heure jour mois jour-semaine
    // Exemple: "0 9,12,15,18 * * 1,2,3,4,5" = 9h, 12h, 15h, 18h du lundi au vendredi
    const cronExpression = `0 ${hour} * * ${cronDays}`;
    
    console.log(`📅 Planification de "${source.name}" avec cron: ${cronExpression}`);
    
    cron.schedule(cronExpression, async () => {
      console.log(`🔄 Exécution du crawl pour "${source.name}" à ${new Date().toLocaleString('fr-FR', { timeZone: timezone })}`);
      try {
        await bot.crawl(source);
      } catch (error) {
        console.error(`❌ Erreur lors du crawl de "${source.name}":`, error);
      }
    }, {
      timezone: timezone || 'Europe/Paris'
    });
  }
};

/**
 * Exécute un crawl manuel pour une source
 */
export const runManualCrawl = async (sourceId) => {
  try {
    const source = await DataSource.findById(sourceId);
    
    if (!source) {
      throw new Error('Source non trouvée');
    }
    
    if (!source.isActive) {
      throw new Error('Source inactive');
    }
    
    const bot = bots[source.type];
    
    if (!bot) {
      throw new Error(`Aucun bot disponible pour le type: ${source.type}`);
    }
    
    console.log(`🔄 Exécution manuelle du crawl pour "${source.name}"`);
    await bot.crawl(source);
    
    return { success: true, message: 'Crawl exécuté avec succès' };
  } catch (error) {
    console.error('❌ Erreur lors du crawl manuel:', error);
    throw error;
  }
};

/**
 * Exécute le crawl initial (première connexion) pour une source
 */
export const runInitialCrawl = async (sourceId) => {
  try {
    const source = await DataSource.findById(sourceId);
    
    if (!source) {
      throw new Error('Source non trouvée');
    }
    
    const bot = bots[source.type];
    
    if (!bot) {
      throw new Error(`Aucun bot disponible pour le type: ${source.type}`);
    }
    
    console.log(`🔄 Exécution du crawl initial pour "${source.name}"`);
    const result = await bot.initialCrawl(source);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du crawl initial:', error);
    throw error;
  }
};

export default {
  initializeBots,
  runManualCrawl,
  runInitialCrawl
};
