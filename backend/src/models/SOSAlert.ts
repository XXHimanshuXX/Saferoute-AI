import mongoose, { Schema, Document } from 'mongoose';

export interface ISOSAlert extends Document {
  user?: mongoose.Types.ObjectId; // References User if logged in
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
    address?: string;
  };
  isActive: boolean;
  reportedAt: Date;
  expiresAt: Date; // TTL field
  phoneNumber?: string;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  isActive: {
    type: Boolean,
    default: true
  },
  reportedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  phoneNumber: String,
  fullName: String
}, {
  timestamps: true
});

// Geospatial index for nearby queries
SOSAlertSchema.index({ location: '2dsphere' });

// TTL index to automatically purge alerts 24 hours after expiresAt is reached
SOSAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISOSAlert>('SOSAlert', SOSAlertSchema);
