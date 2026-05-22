import dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saferoute',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  emergencyBroadcastRadius: parseInt(process.env.EMERGENCY_BROADCAST_RADIUS || '1000'),
  safetyAlertRadius: parseInt(process.env.SAFETY_ALERT_RADIUS || '2000'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
};

// Validate required environment variables
if (!config.jwtSecret || config.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  } else {
    console.warn('⚠️ Using default JWT secret. Please set JWT_SECRET in production.');
  }
}

export default config;
