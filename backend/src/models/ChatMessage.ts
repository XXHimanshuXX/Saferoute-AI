import mongoose, { Schema, Document } from 'mongoose';

const chatMessageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sender: {
    type: String,
    enum: ['user', 'ai', 'system'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location', 'emergency', 'suggestion'],
    default: 'text'
  },
  content: {
    text: String,
    location: {
      address: String,
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number]
      }
    },
    mediaUrl: String,
    mediaType: String,
    suggestions: [String]
  },
  aiResponse: {
    confidence: { type: Number, min: 0, max: 1 },
    intent: String,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }],
    responseTime: Number // in milliseconds
  },
  metadata: {
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    context: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    tags: [String]
  },
  reactions: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['helpful', 'not_helpful', 'emergency'] },
    createdAt: { type: Date, default: Date.now }
  }],
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isFlagged: { type: Boolean, default: false },
  flagReason: String
}, {
  timestamps: true
});

chatMessageSchema.index({ session: 1, createdAt: 1 });
chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, isRead: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
