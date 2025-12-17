import mongoose from 'mongoose';

const keywordItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'pipeline'
  }
}, { _id: false });

const keywordGroupSchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
  },
  keyword: {
    type: String,
    required: true,
    index: true
  },
  // Items associés à ce mot-clé (pipelines, builds, etc.)
  items: [keywordItemSchema],
  // Configuration d'affichage
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
keywordGroupSchema.index({ dataSourceId: 1, keyword: 1 }, { unique: true });

export default mongoose.model('KeywordGroup', keywordGroupSchema);
