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
    enum: ['n8n', 'api', 'manual', 'webhook'],
    required: true
  },
  config: {
    url: String,
    apiKey: String,
    webhookUrl: String,
    credentials: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('DataSource', dataSourceSchema);

