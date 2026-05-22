import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import config from '../config';

export interface AuthRequest extends Request {
  userId?: string;
  user?: IUser;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token format'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    req.userId = user._id.toString();
    req.user = user;
    
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      error: 'Server error',
      message: 'Authentication failed'
    });
  }
};

export default authMiddleware;
