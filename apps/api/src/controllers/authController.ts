import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import type { AuthedRequest } from '../middleware/authMiddleware';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password, displayName } = req.body ?? {};
      const result = await authService.register({ username, email, password, displayName });
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body ?? {};
      const result = await authService.login(email, password);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  },

  async me(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing authenticated user',
          },
        });
      }

      const user = await authService.me(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  },

  logout(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      data: authService.logout(),
    });
  },
};
