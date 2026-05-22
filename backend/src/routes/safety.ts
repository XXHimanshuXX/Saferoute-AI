import { Router, Request, Response } from 'express';
import Incident from '../models/Incident';
import { validateBody, reportIncidentSchema, voteIncidentSchema } from '../middleware/validators';
import { io } from '../server';
import mongoose from 'mongoose';
import * as mockDb from '../utils/mockDb';

const router = Router();

// Helper to check if DB is connected
const isDbConnected = (): boolean => mongoose.connection.readyState === 1;

// REPORT SAFETY INCIDENT
router.post('/incidents', validateBody(reportIncidentSchema), async (req: Request, res: Response) => {
  try {
    const {
      type,
      severity,
      location,
      description,
      fingerprint
    } = req.body;

    // Check if DB is connected
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to record incident.');
      const recentReports = mockDb.mockIncidents.filter(
        inc => inc.fingerprint === fingerprint && (Date.now() - new Date(inc.createdAt).getTime()) < 5 * 60 * 1000
      );

      if (recentReports.length >= 3) {
        return res.status(429).json({
          error: 'Too many reports',
          message: 'Rate limit exceeded. Please wait a few minutes before submitting another report.'
        });
      }

      const mockIncident = mockDb.addMockIncident({
        type,
        severity,
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address
        },
        description,
        fingerprint,
        reportedAt: new Date()
      });

      // Emit real-time notification to nearby users using socket
      io.emit('new-incident', {
        id: mockIncident._id,
        type,
        severity,
        location: mockIncident.location,
        description,
        trustScore: mockIncident.trustScore,
        timestamp: mockIncident.reportedAt
      });

      return res.status(201).json({
        message: 'Incident reported successfully (Mock Database)',
        incident: mockIncident
      });
    }

    // Check for spam: fingerprint cannot report more than 3 incidents in 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReports = await Incident.countDocuments({
      fingerprint,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (recentReports >= 3) {
      return res.status(429).json({
        error: 'Too many reports',
        message: 'Rate limit exceeded. Please wait a few minutes before submitting another report.'
      });
    }

    const incident = new Incident({
      type,
      severity,
      location: {
        type: 'Point',
        coordinates: location.coordinates, // [longitude, latitude]
        address: location.address
      },
      description,
      fingerprint,
      trustScore: 1.0, // default trust score
      reportedAt: new Date()
    });

    await incident.save();

    // Emit real-time notification to nearby users using socket
    io.emit('new-incident', {
      id: incident._id,
      type,
      severity,
      location: incident.location,
      description,
      trustScore: incident.trustScore,
      timestamp: incident.reportedAt
    });

    res.status(201).json({
      message: 'Incident reported successfully',
      incident
    });
  } catch (error: any) {
    console.error('Report incident error:', error);
    res.status(500).json({
      error: 'Failed to report incident',
      message: error.message
    });
  }
});

// GET SAFETY INCIDENTS NEARBY (/incidents/nearby/:lat/:lng)
router.get('/incidents/nearby/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params as { lat: string; lng: string };
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 2000; // default 2km
    const { severity, type, days = '30' } = req.query as { severity?: string; type?: string; days?: string };

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Fallback if database is disconnected
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to query nearby incidents.');
      let incidents = mockDb.queryNearbyMockIncidents(parsedLat, parsedLng, radius);
      
      // Filter by days
      const daysAgo = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);
      incidents = incidents.filter(inc => new Date(inc.reportedAt).getTime() >= daysAgo);

      // Filter by severity & type
      if (severity) {
        incidents = incidents.filter(inc => inc.severity === parseInt(severity));
      }
      if (type) {
        incidents = incidents.filter(inc => inc.type === type);
      }

      return res.json({ incidents });
    }

    const filter: any = {
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat]
          },
          $maxDistance: radius
        }
      },
      reportedAt: {
        $gte: new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000))
      }
    };

    if (severity) filter.severity = parseInt(severity);
    if (type) filter.type = type;

    const incidents = await Incident.find(filter)
      .sort({ reportedAt: -1 })
      .limit(100);

    res.json({ incidents });
  } catch (error: any) {
    console.error('Get nearby incidents error:', error);
    res.status(500).json({
      error: 'Failed to fetch incidents',
      message: error.message
    });
  }
});

// VOTE ON SAFETY INCIDENT (Upvote/Downvote dynamically adjusting trustScore)
router.put('/incidents/:id/vote', validateBody(voteIncidentSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fingerprint, voteType } = req.body;

    // Fallback if database is disconnected
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to vote on incident.');
      const result = mockDb.voteMockIncident(id as string, fingerprint as string, voteType as 'upvote' | 'downvote');
      if (!result) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      return res.json({
        message: 'Vote recorded successfully (Mock Database)',
        trustScore: Math.round(result.trustScore * 10) / 10,
        upvotesCount: result.upvotes.length,
        downvotesCount: result.downvotes.length
      });
    }

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Initialize fields
    incident.upvotes = incident.upvotes || [];
    incident.downvotes = incident.downvotes || [];

    if (voteType === 'upvote') {
      if (incident.upvotes.includes(fingerprint)) {
        // Toggle off
        incident.upvotes = incident.upvotes.filter(f => f !== fingerprint);
      } else {
        incident.upvotes.push(fingerprint);
        // Remove from downvotes
        incident.downvotes = incident.downvotes.filter(f => f !== fingerprint);
      }
    } else {
      if (incident.downvotes.includes(fingerprint)) {
        // Toggle off
        incident.downvotes = incident.downvotes.filter(f => f !== fingerprint);
      } else {
        incident.downvotes.push(fingerprint);
        // Remove from upvotes
        incident.upvotes = incident.upvotes.filter(f => f !== fingerprint);
      }
    }

    // Calculate new trustScore: default 1.0, upvote is +0.2, downvote is -0.3. Min trust is 0.1.
    incident.trustScore = Math.max(0.1, 1.0 + (incident.upvotes.length * 0.2) - (incident.downvotes.length * 0.3));

    await incident.save();

    res.json({
      message: 'Vote recorded successfully',
      trustScore: Math.round(incident.trustScore * 10) / 10,
      upvotesCount: incident.upvotes.length,
      downvotesCount: incident.downvotes.length
    });
  } catch (error: any) {
    console.error('Vote incident error:', error);
    res.status(500).json({
      error: 'Failed to record vote',
      message: error.message
    });
  }
});

// GET SAFETY STATISTICS FOR AREA
router.get('/statistics/:lat/:lng', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params as { lat: string; lng: string };
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 1000;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Fallback if database is disconnected
    if (!isDbConnected()) {
      console.log('⚠️ MongoDB is disconnected. Using mock DB to calculate statistics.');
      let incidents = mockDb.queryNearbyMockIncidents(parsedLat, parsedLng, radius);
      
      const timeFilter = Date.now() - (days * 24 * 60 * 60 * 1000);
      incidents = incidents.filter(inc => new Date(inc.reportedAt).getTime() >= timeFilter);

      const totalIncidents = incidents.length;
      let penalty = 0;
      incidents.forEach(inc => {
        penalty += inc.severity * inc.trustScore;
      });

      const safetyScore = Math.max(0, Math.min(100, 100 - (penalty * 3)));

      return res.json({
        statistics: {
          totalIncidents,
          safetyScore: Math.round(safetyScore),
          timeRange: `${days} days`,
          areaRadius: `${radius}m`
        }
      });
    }

    const timeFilter = {
      $gte: new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
    };

    const incidents = await Incident.find({
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius
        }
      },
      reportedAt: timeFilter
    });

    const totalIncidents = incidents.length;

    // Custom Safety Score calculation
    // Start with 100, deduct based on count and severity
    let penalty = 0;
    incidents.forEach(inc => {
      penalty += inc.severity * inc.trustScore;
    });

    const safetyScore = Math.max(0, Math.min(100, 100 - (penalty * 3)));

    res.json({
      statistics: {
        totalIncidents,
        safetyScore: Math.round(safetyScore),
        timeRange: `${days} days`,
        areaRadius: `${radius}m`
      }
    });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch safety statistics',
      message: error.message
    });
  }
});

export default router;
