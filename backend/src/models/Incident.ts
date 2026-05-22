import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  type: string;
  severity: number; // 1-5
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
    address?: string;
  };
  description: string;
  reportedAt: Date;
  reportedBy?: mongoose.Types.ObjectId; // References User
  fingerprint: string; // client browser fingerprint for spam check
  trustScore: number; // dynamically adjusted
  upvotes: string[]; // array of fingerprints
  downvotes: string[]; // array of fingerprints
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>({
  type: {
    type: String,
    enum: ['theft', 'assault', 'harassment', 'suspicious_activity', 'accident', 'street_light_issue', 'other'],
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  description: {
    type: String,
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fingerprint: {
    type: String,
    required: true
  },
  trustScore: {
    type: Number,
    default: 1.0,
    required: true
  },
  upvotes: {
    type: [String],
    default: []
  },
  downvotes: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

IncidentSchema.index({ location: '2dsphere' });
IncidentSchema.index({ reportedAt: -1 });
IncidentSchema.index({ trustScore: -1 });

export default mongoose.model<IIncident>('Incident', IncidentSchema);
