import mongoose from 'mongoose';

const pipelineLogSchema = new mongoose.Schema({
  dataSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true
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
  pipelineId: {
    type: String,
    required: true,
    index: true
  },
  pipelineName: {
    type: String,
    required: true
  },
  buildId: {
    type: String,
    required: true,
    index: true
  },
  buildNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pipeline', 'publication', 'build', 'release'],
    default: 'pipeline'
  },
  status: {
    type: String,
    enum: ['succeeded', 'failed', 'canceled', 'inProgress', 'partiallySucceeded'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  finishDate: {
    type: Date
  },
  requestedBy: {
    id: String,
    displayName: String,
    email: String
  },
  // Work items associés
  workItems: [{
    id: String,
    title: String,
    type: String,
    state: String,
    url: String
  }],
  // Mots-clés extraits (Preprod, Staging, Production, etc.)
  keywords: [{
    type: String,
    index: true
  }],
  // Logs et détails
  logs: {
    type: String // Logs complets du build
  },
  // Métadonnées
  url: String,
  branch: String,
  commitHash: String,
  commitMessage: String
}, {
  timestamps: true
});

// Index composés pour les requêtes fréquentes
pipelineLogSchema.index({ dataSourceId: 1, date: -1 });
pipelineLogSchema.index({ dataSourceId: 1, projectId: 1, date: -1 });
pipelineLogSchema.index({ dataSourceId: 1, pipelineId: 1, date: -1 });
pipelineLogSchema.index({ keywords: 1, date: -1 });
// Index unique pour éviter les doublons (même build dans la même source)
pipelineLogSchema.index({ dataSourceId: 1, buildId: 1, type: 1 }, { unique: true });

export default mongoose.model('PipelineLog', pipelineLogSchema);
