import { IIncident } from '../models/Incident';
import mongoose from 'mongoose';

export interface MockIncident {
  _id: string;
  type: string;
  severity: number;
  location: {
    type: 'Point';
    coordinates: number[]; // [lng, lat]
    address?: string;
  };
  description: string;
  reportedAt: Date;
  fingerprint: string;
  trustScore: number;
  upvotes: string[];
  downvotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory datastore for active mock incidents
export const mockIncidents: MockIncident[] = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'street_light_issue',
    severity: 4,
    location: {
      type: 'Point',
      coordinates: [75.7873, 26.9185],
      address: 'Civil Lines Crossing, Jaipur'
    },
    description: 'Low Street Lighting in Civil Lines. Very dark at night.',
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    fingerprint: 'mock-fp-1',
    trustScore: 1.0,
    upvotes: ['mock-fp-2', 'mock-fp-3'],
    downvotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'suspicious_activity',
    severity: 4,
    location: {
      type: 'Point',
      coordinates: [75.8065, 26.9052],
      address: 'Bapu Nagar Park, Jaipur'
    },
    description: 'Suspicious groups gathering near Bapu Nagar park in late hours.',
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    fingerprint: 'mock-fp-2',
    trustScore: 1.0,
    upvotes: ['mock-fp-1'],
    downvotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'theft',
    severity: 3,
    location: {
      type: 'Point',
      coordinates: [75.775, 26.922],
      address: 'Sodala Flyover, Jaipur'
    },
    description: 'Snatching attempts reported near Sodala flyover during evening peak hours.',
    reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    fingerprint: 'mock-fp-3',
    trustScore: 1.0,
    upvotes: ['mock-fp-2'],
    downvotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'other',
    severity: 3,
    location: {
      type: 'Point',
      coordinates: [75.776, 26.899],
      address: 'Tonk Rd, Jaipur'
    },
    description: 'Under construction road and low visibility with no barricade alerts.',
    reportedAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago
    fingerprint: 'mock-fp-4',
    trustScore: 0.9,
    upvotes: [],
    downvotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    type: 'harassment',
    severity: 5,
    location: {
      type: 'Point',
      coordinates: [75.799, 26.914],
      address: 'C-Scheme Cafe Street, Jaipur'
    },
    description: 'Public harassment and eve-teasing incidents reported near C-Scheme cafes.',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    fingerprint: 'mock-fp-5',
    trustScore: 1.2,
    upvotes: ['mock-fp-1', 'mock-fp-2', 'mock-fp-3'],
    downvotes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper to calculate Haversine distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Query mock database
export const queryNearbyMockIncidents = (lat: number, lng: number, maxDistanceMeters: number): MockIncident[] => {
  return mockIncidents
    .filter(inc => {
      const dist = getDistanceMeters(lat, lng, inc.location.coordinates[1], inc.location.coordinates[0]);
      return dist <= maxDistanceMeters;
    })
    .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
};

// Add to mock database
export const addMockIncident = (data: Partial<MockIncident>): MockIncident => {
  const incident: MockIncident = {
    _id: data._id || new mongoose.Types.ObjectId().toString(),
    type: data.type || 'other',
    severity: data.severity || 3,
    location: {
      type: 'Point',
      coordinates: data.location?.coordinates || [75.7873, 26.9124],
      address: data.location?.address || 'Jaipur'
    },
    description: data.description || 'Mock Incident description',
    reportedAt: data.reportedAt || new Date(),
    fingerprint: data.fingerprint || 'system-fp',
    trustScore: data.trustScore || 1.0,
    upvotes: data.upvotes || [],
    downvotes: data.downvotes || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  mockIncidents.push(incident);
  return incident;
};

// Vote mock database
export const voteMockIncident = (id: string, fingerprint: string, voteType: 'upvote' | 'downvote') => {
  const incident = mockIncidents.find(inc => inc._id === id);
  if (!incident) return null;

  incident.upvotes = incident.upvotes || [];
  incident.downvotes = incident.downvotes || [];

  if (voteType === 'upvote') {
    if (incident.upvotes.includes(fingerprint)) {
      incident.upvotes = incident.upvotes.filter(f => f !== fingerprint);
    } else {
      incident.upvotes.push(fingerprint);
      incident.downvotes = incident.downvotes.filter(f => f !== fingerprint);
    }
  } else {
    if (incident.downvotes.includes(fingerprint)) {
      incident.downvotes = incident.downvotes.filter(f => f !== fingerprint);
    } else {
      incident.downvotes.push(fingerprint);
      incident.upvotes = incident.upvotes.filter(f => f !== fingerprint);
    }
  }

  incident.trustScore = Math.max(0.1, 1.0 + (incident.upvotes.length * 0.2) - (incident.downvotes.length * 0.3));
  return incident;
};
