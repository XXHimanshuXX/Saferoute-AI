import { Router, Request, Response } from 'express';
import Route from '../models/Route';
import Incident from '../models/Incident';
import authMiddleware, { AuthRequest } from '../middleware/auth';
import { validateBody, scoreRouteSchema } from '../middleware/validators';
import { Coordinates } from '../types';
import mongoose from 'mongoose';
import * as mockDb from '../utils/mockDb';

const router = Router();

// Helper to check if DB is connected
const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

// Helper to calculate distance in meters (Haversine)
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Helper to calculate distance in km
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  return haversineDistanceMeters(coord1.lat, coord1.lng, coord2.lat, coord2.lng) / 1000;
}

// Calculate optimal route
router.post('/calculate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { start, end, routeType = 'safest', preferences } = req.body;

    if (!start || !end || !start.coordinates || !end.coordinates) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Start and end coordinates are required'
      });
    }

    const startCoords: Coordinates = { lat: start.coordinates[1], lng: start.coordinates[0] };
    const endCoords: Coordinates = { lat: end.coordinates[1], lng: end.coordinates[0] };

    const baseDistance = calculateDistance(startCoords, endCoords);
    const baseTime = baseDistance * 12;

    const routes = [
      {
        id: 'route_1',
        name: 'Safest Route',
        routeData: {
          totalDistance: baseDistance * 1.2,
          estimatedTime: baseTime * 1.3,
          safetyScore: 85 + Math.random() * 10,
          routeType: 'safest',
          trafficLevel: 'low',
          lightingLevel: 'good'
        }
      },
      {
        id: 'route_2',
        name: 'Fastest Route',
        routeData: {
          totalDistance: baseDistance,
          estimatedTime: baseTime,
          safetyScore: 65 + Math.random() * 15,
          routeType: 'fastest',
          trafficLevel: 'medium',
          lightingLevel: 'fair'
        }
      }
    ];
    
    res.json({
      routes,
      recommended: routes[0]
    });
  } catch (error: any) {
    console.error('Route calculation error:', error);
    res.status(500).json({
      error: 'Route calculation failed',
      message: error.message
    });
  }
});

// GET USER'S SAVED ROUTES
router.get('/my-routes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const routes = await Route.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ routes });
  } catch (error: any) {
    console.error('Get routes error:', error);
    res.status(500).json({
      error: 'Failed to fetch routes',
      message: error.message
    });
  }
});

// TRUE SAFETY SCORING ROUTE (/api/routes/score)
router.post('/score', validateBody(scoreRouteSchema), async (req: Request, res: Response) => {
  try {
    const { coordinates, streetLightDensity } = req.body;

    // 1. Calculate cumulative route distance in km
    let calculatedRouteDistanceKm = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      calculatedRouteDistanceKm += haversineDistanceMeters(
        coordinates[i].lat, coordinates[i].lng,
        coordinates[i + 1].lat, coordinates[i + 1].lng
      ) / 1000;
    }
    const routeDistanceKm = req.body.routeDistanceKm || calculatedRouteDistanceKm || 0.1;

    // 2. Fetch incidents within 500 meters of the route
    // Downsample the coordinates if too long to optimize DB performance
    const maxPoints = 15;
    const sampledCoords = [];
    if (coordinates.length <= maxPoints) {
      sampledCoords.push(...coordinates);
    } else {
      const step = (coordinates.length - 1) / (maxPoints - 1);
      for (let i = 0; i < maxPoints; i++) {
        sampledCoords.push(coordinates[Math.round(i * step)]);
      }
    }

    // Run queries concurrently using Mongoose 2dsphere $nearSphere
    let queryResults: any[] = [];
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to query nearby incidents for route scoring.');
      queryResults = sampledCoords.map(pt => 
        mockDb.queryNearbyMockIncidents(pt.lat, pt.lng, 500)
      );
    } else {
      const queryPromises = sampledCoords.map(pt => 
        Incident.find({
          location: {
            $nearSphere: {
              $geometry: {
                type: 'Point',
                coordinates: [pt.lng, pt.lat] // [longitude, latitude]
              },
              $maxDistance: 500 // 500 meters
            }
          }
        }).lean()
      );
      queryResults = await Promise.all(queryPromises);
    }

    // Merge and deduplicate by incident ID
    const incidentMap = new Map<string, any>();
    for (const list of queryResults) {
      for (const incident of list) {
        incidentMap.set(incident._id.toString(), incident);
      }
    }
    const nearIncidents = Array.from(incidentMap.values());

    // 3. Mathematical Safety Scoring
    // safetyScore = 100 - SUM( severity_i * timeDecay_i * distanceWeight_i * lightPenalty )
    let totalPenalty = 0;
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 18 || currentHour < 6;
    
    const detailedIncidentsAnalysis = nearIncidents.map(incident => {
      // a. Calculate min distance in meters from incident to the route path
      let minDistanceMeters = Infinity;
      for (const pt of coordinates) {
        const dist = haversineDistanceMeters(
          pt.lat, pt.lng,
          incident.location.coordinates[1], incident.location.coordinates[0] // lat, lng
        );
        if (dist < minDistanceMeters) {
          minDistanceMeters = dist;
        }
      }

      // b. Time decay: exp(-hoursSince/48)
      const hoursSince = (Date.now() - new Date(incident.reportedAt).getTime()) / (1000 * 60 * 60);
      const timeDecay = Math.exp(-hoursSince / 48);

      // c. Distance weight: 1 / (1 + distanceMeters/30)
      const distanceWeight = 1 / (1 + minDistanceMeters / 30);

      // d. Light penalty: 1.5 if night and lighting is low, else 1.0
      let lightPenalty = 1.0;
      if (isNight && (streetLightDensity === 'low' || incident.type === 'street_light_issue')) {
        lightPenalty = 1.5;
      }

      // e. Individual incident penalty contribution
      const penalty = incident.severity * timeDecay * distanceWeight * lightPenalty;
      totalPenalty += penalty;

      return {
        id: incident._id,
        type: incident.type,
        severity: incident.severity,
        minDistanceMeters: Math.round(minDistanceMeters * 10) / 10,
        hoursSince: Math.round(hoursSince * 10) / 10,
        timeDecay: Math.round(timeDecay * 1000) / 1000,
        distanceWeight: Math.round(distanceWeight * 1000) / 1000,
        lightPenalty,
        penaltyContribution: Math.round(penalty * 1000) / 1000
      };
    });

    // Normalize per km (yielding a standard route score)
    const normalizedPenalty = totalPenalty / Math.max(0.5, routeDistanceKm);
    const safetyScore = Math.max(0, Math.min(100, 100 - normalizedPenalty));

    // Determine band: Emerald Safe (80-100), Orange Caution (50-79), Crimson Avoid (<50)
    let safetyBand = 'Orange Caution';
    let bandColor = 'orange';
    if (safetyScore >= 80) {
      safetyBand = 'Emerald Safe';
      bandColor = 'emerald';
    } else if (safetyScore < 50) {
      safetyBand = 'Crimson Avoid';
      bandColor = 'crimson';
    }

    res.json({
      safetyScore: Math.round(safetyScore * 100) / 100,
      safetyBand,
      bandColor,
      routeDistanceKm: Math.round(routeDistanceKm * 100) / 100,
      isNight,
      streetLightDensity,
      totalPenaltiesRaw: Math.round(totalPenalty * 100) / 100,
      normalizedPenalty: Math.round(normalizedPenalty * 100) / 100,
      incidentsFound: nearIncidents.length,
      detailedIncidents: detailedIncidentsAnalysis
    });

  } catch (error: any) {
    console.error('Route scoring error:', error);
    res.status(500).json({
      error: 'Route scoring failed',
      message: error.message
    });
  }
});

export default router;
