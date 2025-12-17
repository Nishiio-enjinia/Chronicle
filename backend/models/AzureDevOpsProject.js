import mongoose from 'mongoose';

const azureDevOpsProjectSchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
  },
  projectId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
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
azureDevOpsProjectSchema.index({ dataSourceId: 1, projectId: 1 }, { unique: true });

export default mongoose.model('AzureDevOpsProject', azureDevOpsProjectSchema);
