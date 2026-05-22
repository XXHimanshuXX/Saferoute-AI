import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'SafeRoute AI Backend is working!',
    version: 'TypeScript',
    timestamp: new Date()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 SafeRoute AI Backend Started!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});
