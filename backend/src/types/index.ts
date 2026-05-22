// Core Types for SafeRoute AI Backend

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  coordinates: Coordinates;
  accuracy?: number;
}

export interface Incident {
  id: string;
  type: 'lighting' | 'crime' | 'crowd' | 'theft' | 'assault' | 'harassment' | 'suspicious_activity' | 'accident' | 'other';
  severity: 1 | 2 | 3; // 1 = Low, 2 = Medium, 3 = High
  location: Location;
  timestamp: Date;
  description: string;
  reportedBy: string;
  verified: boolean;
  status: 'reported' | 'under_investigation' | 'resolved' | 'false_alarm';
  affectedArea: {
    radius: number; // in meters
    affectedRoutes: string[];
  };
  responses: IncidentResponse[];
  media: MediaFile[];
  tags: string[];
  isAnonymous: boolean;
  visibility: 'public' | 'private' | 'authorities_only';
}

export interface IncidentResponse {
  user: string;
  response: string;
  timestamp: Date;
  helpful: boolean;
}

export interface MediaFile {
  type: 'image' | 'video' | 'audio';
  url: string;
  description: string;
  uploadedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  safetyPreferences: SafetyPreferences;
  statistics: UserStatistics;
  isActive: boolean;
  isOnline: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface SafetyPreferences {
  preferredRouteType: 'fastest' | 'safest';
  avoidDarkAreas: boolean;
  shareLocation: boolean;
  emergencyAlerts: boolean;
}

export interface UserStatistics {
  totalRoutes: number;
  safeRoutes: number;
  emergencyAlerts: number;
  lastActive: Date;
}

export interface Route {
  id: string;
  user: string;
  name: string;
  startLocation: Location;
  endLocation: Location;
  waypoints: Waypoint[];
  routeData: RouteData;
  safetyAnalysis: SafetyAnalysis;
  realTimeData: RealTimeData;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  isPublic: boolean;
  tags: string[];
  rating?: number;
  reviews: RouteReview[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Waypoint {
  address: string;
  coordinates: {
    type: 'Point';
    coordinates: [number];
  };
  instructions: string;
  estimatedTime: number;
  distance: number;
}

export interface RouteData {
  totalDistance: number; // in kilometers
  estimatedTime: number; // in minutes
  safetyScore: number; // 0-100
  routeType: 'fastest' | 'safest';
  trafficLevel: 'low' | 'medium' | 'high';
  lightingLevel: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface SafetyAnalysis {
  crimeRate: number; // 0-100
  lightingScore: number; // 0-100
  emergencyServices: number; // 0-100
  populationDensity: 'low' | 'medium' | 'high';
  reportedIncidents: number;
  lastUpdated: Date;
}

export interface RealTimeData {
  currentTraffic: 'clear' | 'moderate' | 'heavy';
  weatherCondition: 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
  visibility: 'poor' | 'fair' | 'good' | 'excellent';
  temperature?: number;
  activeAlerts: string[];
}

export interface RouteReview {
  user: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface EmergencyAlert {
  id: string;
  user: string;
  type: 'medical' | 'police' | 'fire' | 'accident' | 'lost' | 'threat' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: Location;
  description: string;
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  contacts: EmergencyContact[];
  responders: Responder[];
  timeline: TimelineEntry[];
  media: MediaFile[];
  additionalInfo: AdditionalInfo;
  resolvedAt?: Date;
  resolutionNotes?: string;
  isAnonymous: boolean;
  broadcastRadius: number; // in meters
  nearbyUsersAlerted: number;
  createdAt: Date;
}

export interface Responder {
  type: 'user' | 'authority' | 'service';
  name: string;
  contact: string;
  respondedAt: Date;
  estimatedArrival?: Date;
  location?: {
    type: 'Point';
    coordinates: [number];
  };
}

export interface TimelineEntry {
  event: string;
  timestamp: Date;
  location?: {
    type: 'Point';
    coordinates: [number];
  };
  description: string;
}

export interface AdditionalInfo {
  medicalConditions?: string[];
  allergies?: string[];
  medications?: string[];
  emergencyContacts?: EmergencyContact[];
  specialInstructions?: string;
}

export interface ChatSession {
  id: string;
  user: string;
  title: string;
  status: 'active' | 'paused' | 'ended';
  context: ChatContext;
  summary: ChatSummary;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'emergency';
  lastActivity: Date;
  endedAt?: Date;
  feedback?: ChatFeedback;
  createdAt: Date;
}

export interface ChatContext {
  currentLocation?: Location;
  destination?: Location;
  routePreferences: {
    type: 'fastest' | 'safest';
    avoidDarkAreas: boolean;
    shareLocation: boolean;
  };
  emergencyMode: boolean;
  activeRoute?: string;
}

export interface ChatSummary {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  averageResponseTime: number;
  satisfactionScore?: number;
  resolved: boolean;
}

export interface ChatFeedback {
  rating?: number; // 1-5
  comment?: string;
  helpful: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  session: string;
  message: string;
  sender: 'user' | 'ai' | 'system';
  messageType: 'text' | 'image' | 'location' | 'emergency' | 'suggestion';
  content: MessageContent;
  aiResponse?: AIResponse;
  metadata: MessageMetadata;
  reactions: MessageReaction[];
  isRead: boolean;
  readAt?: Date;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: Date;
}

export interface MessageContent {
  text?: string;
  location?: Location;
  mediaUrl?: string;
  mediaType?: string;
  suggestions?: string[];
}

export interface AIResponse {
  confidence: number; // 0-1
  intent: string;
  entities: Entity[];
  responseTime: number; // in milliseconds
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

export interface MessageMetadata {
  location?: {
    type: 'Point';
    coordinates: [number];
  };
  context?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface MessageReaction {
  user: string;
  type: 'helpful' | 'not_helpful' | 'emergency';
  createdAt: Date;
}

// API Request/Response Types
export interface CalculateRouteRequest {
  start: Location;
  end: Location;
  routeType?: 'fastest' | 'safest';
  preferences?: RoutePreferences;
}

export interface RoutePreferences {
  avoidDarkAreas?: boolean;
  avoidHighTraffic?: boolean;
  preferWellLit?: boolean;
  maxWalkingDistance?: number; // in meters
}

export interface CalculateRouteResponse {
  routes: Route[];
  recommended: Route;
  metadata: {
    calculationTime: number;
    preferences: RoutePreferences;
    totalRoutes: number;
  };
}

export interface SafetyStatistics {
  totalIncidents: number;
  safetyScore: number;
  incidentsBySeverity: Array<{
    _id: string;
    count: number;
  }>;
  incidentsByType: Array<{
    _id: string;
    count: number;
  }>;
  timeRange: string;
  areaRadius: string;
}

export interface HeatmapData {
  lat: number;
  lng: number;
  intensity: number; // 0-1
}

export interface HeatmapResponse {
  heatmapData: HeatmapData[];
  metadata: {
    center: Coordinates;
    radius: number;
    gridSize: number;
    totalPoints: number;
  };
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client to Server
  'join-location': (location: Coordinates) => void;
  'emergency-alert': (alert: EmergencyAlert) => void;
  'location-update': (data: { location: Location; userId: string }) => void;
  
  // Server to Client
  'emergency-broadcast': (alert: EmergencyAlert) => void;
  'nearby-emergency': (alert: EmergencyAlert) => void;
  'emergency-response': (data: { alertId: string; responder: Responder; status: string }) => void;
  'emergency-status-update': (data: { alertId: string; status: string; resolvedAt?: Date }) => void;
  'new-incident': (incident: Incident) => void;
  'chat-message': (data: { sessionId: string; message: ChatMessage; timestamp: Date }) => void;
  'user-location': (data: { location: Location; userId: string; timestamp: Date }) => void;
}

// Database Query Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

// AI Assistant Types
export interface AIRequest {
  message: string;
  context?: ChatContext;
  metadata?: MessageMetadata;
  sessionId: string;
}

export interface AIResponseData {
  text: string;
  confidence: number;
  intent: string;
  entities: Entity[];
  suggestions: string[];
  responseTime: number;
}

// Environment Configuration
export interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  googleMapsApiKey?: string;
  openWeatherApiKey?: string;
  emergencyBroadcastRadius: number;
  safetyAlertRadius: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}
