const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saferoute')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join location-based room for real-time updates
  socket.on('join-location', (location) => {
    const room = `location-${location.lat}-${location.lng}`;
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  // Handle emergency alerts
  socket.on('emergency-alert', (data) => {
    io.emit('emergency-broadcast', {
      ...data,
      timestamp: new Date(),
      id: socket.id
    });
  });
  
  // Handle location tracking
  socket.on('location-update', (data) => {
    socket.broadcast.emit('user-location', {
      ...data,
      userId: socket.id,
      timestamp: new Date()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/safety', require('./routes/safety'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/chat', require('./routes/chat'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

module.exports = { app, io };
