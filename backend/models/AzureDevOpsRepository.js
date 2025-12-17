import mongoose from 'mongoose';

const azureDevOpsRepositorySchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
  },
  repositoryId: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: true,
    index: true
  },
  projectName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  defaultBranch: {
    type: String
  },
  // Métadonnées pour personnalisation de l'affichage
  displayName: {
    type: String // Nom personnalisé pour l'affichage
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index unique pour éviter les doublons
azureDevOpsRepositorySchema.index({ dataSourceId: 1, repositoryId: 1 }, { unique: true });
// Index pour les requêtes par projet
azureDevOpsRepositorySchema.index({ dataSourceId: 1, projectId: 1 });

export default mongoose.model('AzureDevOpsRepository', azureDevOpsRepositorySchema);
