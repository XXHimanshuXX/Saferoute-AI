import mongoose from 'mongoose';
import { Config } from '../types';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saferoute';
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📍 Database: ${mongoUri}`);
    
    // Set up mongoose configuration
    mongoose.set('strictQuery', true);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
