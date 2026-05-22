# SafeRoute AI Backend

A comprehensive backend API for the SafeRoute AI application, providing real-time safety monitoring, route optimization, emergency alerts, and AI-powered assistance.

## Features

### 🔐 Authentication & User Management
- JWT-based authentication
- User registration and profile management
- Location tracking and safety preferences
- Emergency contacts management

### 🗺️ Route Management
- AI-powered route calculation
- Safety scoring and analysis
- Real-time traffic and weather integration
- Route saving and sharing

### 🚨 Emergency System
- Real-time emergency alerts
- Nearby user notifications
- Emergency responder coordination
- Timeline tracking and status updates

### 🛡️ Safety Monitoring
- Incident reporting and verification
- Geospatial safety analysis
- Heatmap generation
- Community response system

### 🤖 AI Chat Assistant
- Intelligent safety conversations
- Context-aware responses
- Real-time messaging with Socket.IO
- Session management and analytics

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/location` - Update user location
- `POST /api/auth/logout` - User logout

### Routes
- `POST /api/routes/calculate` - Calculate optimal route
- `POST /api/routes/save` - Save route
- `GET /api/routes/my-routes` - Get user routes
- `GET /api/routes/:routeId` - Get route details
- `PUT /api/routes/:routeId/status` - Update route status
- `POST /api/routes/:routeId/reviews` - Add route review
- `GET /api/routes/nearby/:lat/:lng` - Get nearby routes

### Safety
- `POST /api/safety/incidents` - Report safety incident
- `GET /api/safety/incidents/nearby/:lat/:lng` - Get nearby incidents
- `GET /api/safety/incidents/:incidentId` - Get incident details
- `POST /api/safety/incidents/:incidentId/responses` - Add response
- `PUT /api/safety/incidents/:incidentId/verify` - Verify incident
- `GET /api/safety/statistics/:lat/:lng` - Get safety statistics
- `GET /api/safety/heatmap/:lat/:lng` - Get safety heatmap

### Emergency
- `POST /api/emergency/alert` - Create emergency alert
- `GET /api/emergency/active` - Get active alerts
- `POST /api/emergency/:alertId/respond` - Respond to emergency
- `PUT /api/emergency/:alertId/status` - Update emergency status
- `POST /api/emergency/:alertId/timeline` - Add timeline entry
- `GET /api/emergency/statistics` - Get emergency statistics
- `GET /api/emergency/my-alerts` - Get user alerts

### Chat
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions` - Get user sessions
- `GET /api/chat/sessions/:sessionId` - Get session details
- `POST /api/chat/sessions/:sessionId/messages` - Send message
- `GET /api/chat/sessions/:sessionId/messages` - Get messages
- `POST /api/chat/messages/:messageId/reactions` - Add reaction
- `PUT /api/chat/sessions/:sessionId/context` - Update context
- `PUT /api/chat/sessions/:sessionId/end` - End session

## Socket.IO Events

### Client to Server
- `join-location` - Join location-based room
- `emergency-alert` - Send emergency alert
- `location-update` - Update user location

### Server to Client
- `emergency-broadcast` - Broadcast emergency alerts
- `nearby-emergency` - Notify nearby users
- `emergency-response` - Emergency response updates
- `emergency-status-update` - Status changes
- `new-incident` - New safety incidents
- `chat-message` - Real-time chat messages
- `user-location` - Location updates

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB (required):
```bash
mongod
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `OPENWEATHER_API_KEY` - OpenWeather API key

## Database Schema

### Users
- Authentication and profile information
- Location and safety preferences
- Emergency contacts
- Usage statistics

### Routes
- Start/end points and waypoints
- Safety analysis and scoring
- Real-time conditions
- User reviews and ratings

### Safety Incidents
- Incident reports and verification
- Geospatial data
- Community responses
- Media attachments

### Emergency Alerts
- Emergency notifications
- Responder coordination
- Timeline tracking
- Contact notifications

### Chat Sessions & Messages
- Conversation management
- AI response generation
- Context tracking
- User feedback

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization

## Real-time Features

- Location-based room joining
- Emergency broadcast system
- Live chat messaging
- Incident notifications
- User location sharing

## Development

The API includes comprehensive error handling, logging, and validation. All routes are protected with authentication middleware where appropriate.

## Testing

```bash
# Run tests (when implemented)
npm test
```

## License

ISC
