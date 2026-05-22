import mongoose, { Schema, Document } from 'mongoose';

const safetyIncidentSchema = new Schema({
  type: {
    type: String,
    enum: ['theft', 'assault', 'harassment', 'suspicious_activity', 'accident', 'other'],
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
    description: String
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  incidentTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  status: {
    type: String,
    enum: ['reported', 'under_investigation', 'resolved', 'false_alarm'],
    default: 'reported'
  },
  affectedArea: {
    radius: { type: Number, default: 500 }, // in meters
    affectedRoutes: [String]
  },
  responses: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    response: String,
    timestamp: { type: Date, default: Date.now },
    helpful: { type: Boolean, default: false }
  }],
  media: [{
    type: { type: String, enum: ['image', 'video', 'audio'] },
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  isAnonymous: { type: Boolean, default: false },
  visibility: {
    type: String,
    enum: ['public', 'private', 'authorities_only'],
    default: 'public'
  },
  resolvedAt: Date,
  resolutionNotes: String
}, {
  timestamps: true
});

safetyIncidentSchema.index({ location: '2dsphere' });
safetyIncidentSchema.index({ incidentTime: -1 });
safetyIncidentSchema.index({ severity: 1 });
safetyIncidentSchema.index({ status: 1 });
safetyIncidentSchema.index({ 
  'location.coordinates': '2dsphere', 
  incidentTime: -1 
});

export default mongoose.model('SafetyIncident', safetyIncidentSchema);
