import mongoose, { Schema, Document } from 'mongoose';

const emergencyAlertSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['medical', 'police', 'fire', 'accident', 'lost', 'threat', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    accuracy: Number // GPS accuracy in meters
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['active', 'responding', 'resolved', 'false_alarm'],
    default: 'active'
  },
  contacts: [{
    name: String,
    phone: String,
    relationship: String,
    notified: { type: Boolean, default: false },
    notifiedAt: Date,
    response: String
  }],
  responders: [{
    type: { type: String, enum: ['user', 'authority', 'service'] },
    name: String,
    contact: String,
    respondedAt: { type: Date, default: Date.now },
    estimatedArrival: Date,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    }
  }],
  timeline: [{
    event: String,
    timestamp: { type: Date, default: Date.now },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    description: String
  }],
  media: [{
    type: { type: String, enum: ['image', 'video', 'audio'] },
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  additionalInfo: {
    medicalConditions: [String],
    allergies: [String],
    medications: [String],
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }],
    specialInstructions: String
  },
  resolvedAt: Date,
  resolutionNotes: String,
  isAnonymous: { type: Boolean, default: false },
  broadcastRadius: { type: Number, default: 1000 }, // in meters
  nearbyUsersAlerted: { type: Number, default: 0 }
}, {
  timestamps: true
});

emergencyAlertSchema.index({ location: '2dsphere' });
emergencyAlertSchema.index({ status: 1, createdAt: -1 });
emergencyAlertSchema.index({ user: 1, createdAt: -1 });
emergencyAlertSchema.index({ 
  'location.coordinates': '2dsphere', 
  status: 1 
});

export default mongoose.model('EmergencyAlert', emergencyAlertSchema);
