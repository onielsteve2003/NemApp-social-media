import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../middleware/authMiddleware';
import { storyService } from '../services/storyService';

export const storyController = {
  async feed(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const stories = await storyService.getFeed(req.auth!.userId);
      res.json({ success: true, data: { stories } });
    } catch (error) {
      next(error);
    }
  },

  async userStories(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const stories = await storyService.getUserStories(req.auth!.userId, req.params.userId);
      res.json({ success: true, data: { stories } });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const story = await storyService.createStory(req.auth!.userId, req.body ?? {});
      res.status(201).json({ success: true, data: { story } });
    } catch (error) {
      next(error);
    }
  },

  async seen(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await storyService.markSeen(req.auth!.userId, req.params.storyId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },

  async like(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await storyService.toggleLike(req.auth!.userId, req.params.storyId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await storyService.deleteStory(req.auth!.userId, req.params.storyId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },

  async reshare(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const story = await storyService.reshareStory(req.auth!.userId, req.params.storyId);
      res.status(201).json({ success: true, data: { story } });
    } catch (error) {
      next(error);
    }
  },
};