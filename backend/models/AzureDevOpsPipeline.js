import mongoose from 'mongoose';

const azureDevOpsPipelineSchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
  },
  pipelineId: {
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
  path: {
    type: String
  },
  repository: {
    id: String,
    type: String,
    name: String
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
azureDevOpsPipelineSchema.index({ dataSourceId: 1, pipelineId: 1 }, { unique: true });
// Index pour les requêtes par projet
azureDevOpsPipelineSchema.index({ dataSourceId: 1, projectId: 1 });

export default mongoose.model('AzureDevOpsPipeline', azureDevOpsPipelineSchema);
