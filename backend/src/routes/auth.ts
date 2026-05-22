import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = Router();

// Register user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'Email or username already registered'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      profile: profile || {}
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: (user as any).toPublicJSON()
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check password
    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    (user as any).lastLogin = new Date();
    (user as any).isOnline = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: (user as any).toPublicJSON()
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: (user as any).toPublicJSON()
    });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { profile, safetyPreferences } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (profile) {
      (user as any).profile = { ...(user as any).profile, ...profile };
    }

    if (safetyPreferences) {
      (user as any).safetyPreferences = { ...(user as any).safetyPreferences, ...safetyPreferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: (user as any).toPublicJSON()
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Update user location
router.put('/location', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { coordinates } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    (user as any).location = {
      type: 'Point',
      coordinates: [coordinates.lng, coordinates.lat]
    };

    await user.save();

    res.json({
      message: 'Location updated successfully',
      location: (user as any).location
    });
  } catch (error: any) {
    console.error('Location update error:', error);
    res.status(500).json({
      error: 'Failed to update location',
      message: error.message
    });
  }
});

// Logout user
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      (user as any).isOnline = false;
      await user.save();
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

export default router;
