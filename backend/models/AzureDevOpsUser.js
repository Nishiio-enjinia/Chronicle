import mongoose from 'mongoose';

const azureDevOpsUserSchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  principalName: {
    type: String
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  // Métadonnées pour personnalisation de l'affichage
  customDisplayName: {
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
azureDevOpsUserSchema.index({ dataSourceId: 1, userId: 1 }, { unique: true });

export default mongoose.model('AzureDevOpsUser', azureDevOpsUserSchema);
