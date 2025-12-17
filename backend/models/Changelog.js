import mongoose from 'mongoose';

const changelogSchema = new mongoose.Schema({
  site: {
    type: String,
    required: true,
    index: true
  },
  application: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true
  },
  buildNumber: {
    type: String,
    required: true
  },
  changes: [{
    type: {
      type: String,
      enum: ['feature', 'fix', 'update', 'security', 'breaking'],
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  buildDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['n8n', 'manual'],
    default: 'n8n'
  },
  metadata: {
    pipelineId: String,
    commitHash: String,
    branch: String,
    author: String
  }
}, {
  timestamps: true
});

// Index composé pour les requêtes fréquentes
changelogSchema.index({ site: 1, application: 1, buildDate: -1 });
changelogSchema.index({ buildDate: -1 });

export default mongoose.model('Changelog', changelogSchema);















