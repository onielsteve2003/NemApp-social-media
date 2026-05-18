import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';

export interface AuthedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    username: string;
  };
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token'));
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Missing bearer token'));
  }

  try {
    req.auth = authService.verifyAccessToken(token);
    return next();
  } catch {
    return next(new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}
