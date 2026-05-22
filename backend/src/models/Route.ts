import mongoose, { Schema, Document } from 'mongoose';

const routeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  endLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  waypoints: [{
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number]
    },
    instructions: String,
    estimatedTime: Number,
    distance: Number
  }],
  routeData: {
    totalDistance: { type: Number, required: true }, // in kilometers
    estimatedTime: { type: Number, required: true }, // in minutes
    safetyScore: { type: Number, min: 0, max: 100, required: true },
    routeType: { type: String, enum: ['fastest', 'safest'], required: true },
    trafficLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    lightingLevel: { type: String, enum: ['poor', 'fair', 'good', 'excellent'], default: 'fair' }
  },
  safetyAnalysis: {
    crimeRate: { type: Number, min: 0, max: 100, default: 0 },
    lightingScore: { type: Number, min: 0, max: 100, default: 50 },
    emergencyServices: { type: Number, min: 0, max: 100, default: 50 },
    populationDensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    reportedIncidents: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  realTimeData: {
    currentTraffic: { type: String, enum: ['clear', 'moderate', 'heavy'], default: 'clear' },
    weatherCondition: { type: String, enum: ['clear', 'rain', 'snow', 'fog', 'storm'], default: 'clear' },
    visibility: { type: String, enum: ['poor', 'fair', 'good', 'excellent'], default: 'good' },
    temperature: Number,
    activeAlerts: [String]
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  isPublic: { type: Boolean, default: false },
  tags: [String],
  rating: { type: Number, min: 1, max: 5, default: null },
  reviews: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
}, {
  timestamps: true
});

routeSchema.index({ 'startLocation.coordinates': '2dsphere' });
routeSchema.index({ 'endLocation.coordinates': '2dsphere' });
routeSchema.index({ user: 1, createdAt: -1 });
routeSchema.index({ 'routeData.safetyScore': -1 });

export default mongoose.model('Route', routeSchema);
