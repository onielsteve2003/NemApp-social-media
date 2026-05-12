import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../middleware/authMiddleware';
import { userService } from '../services/userService';

export const userController = {
  async relationships(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await userService.getRelationships(req.auth!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async discover(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const users = await userService.discover(req.auth!.userId);
      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  },

  async search(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const query = String(req.query.query ?? '');
      const users = await userService.search(req.auth!.userId, query);
      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  },

  async profile(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getProfileByUsername(req.auth!.userId, req.params.username);
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  },

  async followers(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const users = await userService.getFollowers(req.auth!.userId, req.params.username);
      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  },

  async following(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const users = await userService.getFollowing(req.auth!.userId, req.params.username);
      res.json({ success: true, data: { users } });
    } catch (error) {
      next(error);
    }
  },

  async toggleFollow(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await userService.toggleFollow(req.auth!.userId, req.params.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateMe(req.auth!.userId, req.body ?? {});
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  },
};