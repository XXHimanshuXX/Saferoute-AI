import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Schema for coordinates
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// Schema for Location
const locationSchema = z.object({
  address: z.string().optional(),
  coordinates: z.array(z.number()).length(2) // [longitude, latitude]
});

// 1. Route score validator
export const scoreRouteSchema = z.object({
  coordinates: z.array(coordinatesSchema).min(2, 'Route must have at least 2 points'),
  streetLightDensity: z.enum(['low', 'medium', 'high']).default('medium'),
  routeDistanceKm: z.number().positive().optional()
});

// 2. Incident reporting validator
export const reportIncidentSchema = z.object({
  type: z.enum(['theft', 'assault', 'harassment', 'suspicious_activity', 'accident', 'street_light_issue', 'other']),
  severity: z.number().int().min(1).max(5),
  location: z.object({
    coordinates: z.array(z.number()).length(2), // [longitude, latitude]
    address: z.string().optional()
  }),
  description: z.string().min(5).max(1000),
  fingerprint: z.string().min(3, 'Fingerprint is required')
});

// 3. Incident voting validator
export const voteIncidentSchema = z.object({
  fingerprint: z.string().min(3, 'Fingerprint is required'),
  voteType: z.enum(['upvote', 'downvote'])
});

// 4. Chat RAG validator
export const chatRagSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  sessionId: z.string().optional()
});

// Generic validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errs = (error as any).errors || (error as any).issues || [];
        return res.status(400).json({
          error: 'Validation failed',
          details: errs.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};
