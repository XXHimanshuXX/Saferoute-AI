import { Router, Request, Response } from 'express';
import SOSAlert from '../models/SOSAlert';
import User from '../models/User';
import authMiddleware, { AuthRequest } from '../middleware/auth';
import { io } from '../server';

const router = Router();

// CREATE EMERGENCY SOS ALERT
router.post('/alert', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      location,
      phoneNumber,
      fullName
    } = req.body;

    if (!location || !location.coordinates) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Location coordinates are required'
      });
    }

    const sosAlert = new SOSAlert({
      user: req.userId,
      location: {
        type: 'Point',
        coordinates: location.coordinates, // [longitude, latitude]
        address: location.address
      },
      isActive: true,
      phoneNumber,
      fullName
    });

    await sosAlert.save();

    // Emit real-time emergency broadcast (Socket.IO)
    io.emit('emergency-broadcast', {
      id: sosAlert._id,
      location: sosAlert.location,
      fullName,
      phoneNumber,
      timestamp: sosAlert.reportedAt
    });

    res.status(201).json({
      message: 'SOS alert created successfully',
      alert: sosAlert
    });
  } catch (error: any) {
    console.error('SOS alert creation error:', error);
    res.status(500).json({
      error: 'Failed to create SOS alert',
      message: error.message
    });
  }
});

// GET ACTIVE SOS ALERTS NEARBY
router.get('/active', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5000;

    const filter: any = { isActive: true };

    if (lat && lng) {
      filter['location.coordinates'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
          },
          $maxDistance: radius
        }
      };
    }

    const alerts = await SOSAlert.find(filter)
      .populate('user', 'username')
      .sort({ reportedAt: -1 })
      .limit(20);

    res.json({ alerts });
  } catch (error: any) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch active alerts',
      message: error.message
    });
  }
});

export default router;
