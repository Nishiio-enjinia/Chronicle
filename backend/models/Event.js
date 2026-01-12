import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['maintenance', 'intervention', 'incident', 'announcement'],
    required: true
  },
  site: {
    type: String,
    required: true,
    index: true
  },
  application: {
    type: String,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
eventSchema.index({ site: 1, startDate: -1 });
eventSchema.index({ type: 1, startDate: -1 });
eventSchema.index({ status: 1 });

export default mongoose.model('Event', eventSchema);

























