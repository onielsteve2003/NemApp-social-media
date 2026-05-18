import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../middleware/authMiddleware.js';
import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  async list(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.listForUser(req.auth!.userId);
      res.json({ success: true, data: { notifications } });
    } catch (error) {
      next(error);
    }
  },

  async read(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markRead(req.auth!.userId, req.params.notificationId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },

  async readAll(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.auth!.userId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },

  async clear(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.clearAll(req.auth!.userId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },
};