import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  safetyPreferences: {
    preferredRouteType: 'fastest' | 'safest';
    avoidDarkAreas: boolean;
    shareLocation: boolean;
    emergencyAlerts: boolean;
  };
  statistics: {
    totalRoutes: number;
    safeRoutes: number;
    emergencyAlerts: number;
    lastActive: Date;
  };
  isActive: boolean;
  isOnline: boolean;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): any;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  safetyPreferences: {
    preferredRouteType: { type: String, enum: ['fastest', 'safest'], default: 'safest' },
    avoidDarkAreas: { type: Boolean, default: true },
    shareLocation: { type: Boolean, default: false },
    emergencyAlerts: { type: Boolean, default: true }
  },
  statistics: {
    totalRoutes: { type: Number, default: 0 },
    safeRoutes: { type: Number, default: 0 },
    emergencyAlerts: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  isActive: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user public data
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
