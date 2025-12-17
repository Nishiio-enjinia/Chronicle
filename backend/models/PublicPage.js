import mongoose from 'mongoose';

const publicPageSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  requiredRoles: [{
    type: String,
    enum: ['admin', 'user', 'guest']
  }]
}, {
  timestamps: true
});

export default mongoose.model('PublicPage', publicPageSchema);

