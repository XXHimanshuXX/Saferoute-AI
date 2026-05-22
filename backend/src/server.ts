import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import { connectDatabase } from './config/database';
import { SocketEvents } from './types';

// Import routes
import authRoutes from './routes/auth';
import routeRoutes from './routes/routes';
import safetyRoutes from './routes/safety';
import emergencyRoutes from './routes/emergency';
import chatRoutes from './routes/chat';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.nodeEnv === 'production' ? false : ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/chat', chatRoutes);

// Active socket tracking for geospatial mesh broadcasts
interface ActiveSocket {
  socketId: string;
  userId?: string;
  lat?: number;
  lng?: number;
}
const activeSockets = new Map<string, ActiveSocket>();

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

import SOSAlert from './models/SOSAlert';

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  // Track this socket connection
  activeSockets.set(socket.id, { socketId: socket.id });
  
  // Join location room and register active coordinates
  socket.on('join-location', (location: { lat: number; lng: number; userId?: string }) => {
    const active = activeSockets.get(socket.id);
    if (active) {
      active.lat = location.lat;
      active.lng = location.lng;
      if (location.userId) active.userId = location.userId;
    }
    
    // Join rounded coordinate grid room (approx 1.1km precision for general notifications)
    const roundedLat = Math.round(location.lat * 100) / 100;
    const roundedLng = Math.round(location.lng * 100) / 100;
    const gridRoom = `grid-${roundedLat}-${roundedLng}`;
    
    socket.join(gridRoom);
    console.log(`📍 Socket ${socket.id} joined location grid: ${gridRoom} (lat: ${location.lat}, lng: ${location.lng})`);
  });
  
  // Handle SOS broadcast (sos:start)
  socket.on('sos:start', async (data: { lat: number; lng: number; fullName?: string; phoneNumber?: string }) => {
    console.log(`🚨 SOS Alert triggered by socket ${socket.id} at [${data.lat}, ${data.lng}]`);
    
    const active = activeSockets.get(socket.id);
    const userId = active?.userId;
    
    try {
      // 1. Save SOS Alert to database (automatically purged after 24 hours by TTL index)
      const sosAlert = new SOSAlert({
        user: userId,
        location: {
          type: 'Point',
          coordinates: [data.lng, data.lat] // [longitude, latitude]
        },
        isActive: true,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber
      });
      await sosAlert.save();
      
      // 2. Loop through all active sockets and broadcast to those within a 2km radius
      let alertCount = 0;
      for (const [sid, activeSock] of activeSockets.entries()) {
        if (activeSock.lat !== undefined && activeSock.lng !== undefined) {
          const dist = haversineDistance(data.lat, data.lng, activeSock.lat, activeSock.lng);
          if (dist <= 2000) { // 2km
            io.to(sid).emit('sos:broadcast', {
              alertId: sosAlert._id,
              lat: data.lat,
              lng: data.lng,
              fullName: data.fullName,
              phoneNumber: data.phoneNumber,
              distanceMeters: Math.round(dist),
              reportedAt: sosAlert.reportedAt
            });
            alertCount++;
          }
        }
      }
      
      console.log(`🚨 Broadcasted SOS alert to ${alertCount} active users within 2km`);
      
      // Send acknowledgement back to the sender
      socket.emit('sos:ack', {
        success: true,
        alertId: sosAlert._id,
        listenersNotified: alertCount
      });
      
    } catch (err: any) {
      console.error('❌ Failed to process SOS alert:', err);
      socket.emit('sos:ack', {
        success: false,
        error: err.message
      });
    }
  });

  // Handle emergency status updates
  socket.on('emergency-alert', (data) => {
    console.log(`🚨 General emergency alert from user ${socket.id}:`, data);
    io.emit('emergency-broadcast', {
      ...data,
      timestamp: new Date(),
      socketId: socket.id
    });
  });
  
  // Handle real-time location updates for tracking on the map
  socket.on('location-update', (data: { lat: number; lng: number; userId?: string }) => {
    const active = activeSockets.get(socket.id);
    if (active) {
      active.lat = data.lat;
      active.lng = data.lng;
      if (data.userId) active.userId = data.userId;
    }
    
    socket.broadcast.emit('user-location', {
      lat: data.lat,
      lng: data.lng,
      userId: data.userId || socket.id,
      timestamp: new Date()
    });
  });

  socket.on('join-chat', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`💬 User ${userId} joined chat room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    activeSockets.delete(socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      '/health',
      '/api/auth/*',
      '/api/routes/*',
      '/api/safety/*',
      '/api/emergency/*',
      '/api/chat/*'
    ]
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Start server first, then connect to database in background
    server.listen(config.port, '0.0.0.0', () => {
      console.log('🚀 SafeRoute AI Backend Server Started Successfully!');
      console.log(`📍 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Socket.IO server ready`);
      console.log(`💚 Health check: http://localhost:${config.port}/health`);
      
      if (config.nodeEnv === 'development') {
        console.log('📚 Available API Endpoints:');
        console.log('   POST /api/auth/register - User registration');
        console.log('   POST /api/auth/login - User login');
        console.log('   POST /api/routes/calculate - Calculate safe routes');
        console.log('   POST /api/safety/incidents - Report safety incidents');
        console.log('   POST /api/emergency/alert - Create emergency alert');
        console.log('   POST /api/chat/sessions - Create chat session');
        console.log('   GET  /api/safety/statistics/:lat/:lng - Get safety statistics');
        console.log('   GET  /api/safety/heatmap/:lat/:lng - Get safety heatmap');
      }
    });
    
    // Connect to database in background (non-blocking)
    if (config.nodeEnv === 'production') {
      await connectDatabase();
    } else {
      // In development, try to connect but don't fail if MongoDB isn't running
      connectDatabase().catch(error => {
        console.warn('⚠️ MongoDB not available, running without database');
        console.log('💡 To enable full functionality, start MongoDB');
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, io, startServer };
