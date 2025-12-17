import mongoose from 'mongoose';

const dataSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['n8n', 'api', 'manual', 'webhook', 'azure-devops'],
    required: true
  },
  config: {
    url: String,
    apiKey: String,
    webhookUrl: String,
    credentials: mongoose.Schema.Types.Mixed,
    // Azure DevOps specific
    organizationUrl: String,
    personalAccessToken: String,
    crawlRepositories: {
      type: Boolean,
      default: false
    },
    crawlPipelines: {
      type: Boolean,
      default: false
    },
    selectedProjects: [{
      type: String // Liste des noms de projets à crawler (vide = tous les projets)
    }],
    // Options de crawl pour les données opérationnelles
    crawlLogs: {
      type: Boolean,
      default: true // Par défaut, on crawle les logs
    },
    crawlWorkItems: {
      type: Boolean,
      default: true // Par défaut, on crawle les work items
    },
    crawlReleases: {
      type: Boolean,
      default: false
    }
  },
  // Planification du crawl
  schedule: {
    days: [{
      type: Number, // 0 = Dimanche, 1 = Lundi, etc.
      min: 0,
      max: 6
    }],
    hours: [{
      type: Number, // 0-23
      min: 0,
      max: 23
    }],
    timezone: {
      type: String,
      default: 'Europe/Paris'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  // Indicateur que le crawl initial a été effectué
  initialCrawlCompleted: {
    type: Boolean,
    default: false
  },
  initialCrawlCompletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('DataSource', dataSourceSchema);

