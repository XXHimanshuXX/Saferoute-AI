import mongoose, { Schema, Document } from 'mongoose';

const chatSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat Session'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  context: {
    currentLocation: {
      address: String,
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
      }
    },
    destination: {
      address: String,
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
      }
    },
    routePreferences: {
      type: { type: String, enum: ['fastest', 'safest'], default: 'safest' },
      avoidDarkAreas: { type: Boolean, default: true },
      shareLocation: { type: Boolean, default: false }
    },
    emergencyMode: { type: Boolean, default: false },
    activeRoute: {
      type: Schema.Types.ObjectId,
      ref: 'Route'
    }
  },
  summary: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    aiMessages: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, min: 1, max: 5 },
    resolved: { type: Boolean, default: false }
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  lastActivity: { type: Date, default: Date.now },
  endedAt: Date,
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    helpful: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

chatSessionSchema.index({ user: 1, lastActivity: -1 });
chatSessionSchema.index({ status: 1, lastActivity: -1 });
chatSessionSchema.index({ priority: 1, createdAt: -1 });

export default mongoose.model('ChatSession', chatSessionSchema);
