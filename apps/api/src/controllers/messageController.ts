import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../middleware/authMiddleware.js';
import { messageService } from '../services/messageService.js';

export const messageController = {
  async conversations(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await messageService.listConversations(req.auth!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async open(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = await messageService.openConversation(req.auth!.userId, req.body?.participantId);
      res.status(201).json({ success: true, data: { conversationId } });
    } catch (error) {
      next(error);
    }
  },

  async send(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const message = await messageService.sendMessage(req.auth!.userId, req.params.conversationId, req.body?.content);
      res.status(201).json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  },

  async read(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      await messageService.markConversationRead(req.auth!.userId, req.params.conversationId);
      res.json({ success: true, data: { ok: true } });
    } catch (error) {
      next(error);
    }
  },

  async editMessage(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const message = await messageService.editMessage(
        req.auth!.userId,
        req.params.conversationId,
        req.params.messageId,
        req.body?.content ?? ''
      );
      res.json({ success: true, data: { message } });
    } catch (error) {
      next(error);
    }
  },

  async deleteMessage(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const scope = req.query.scope === 'all' ? 'all' : 'me';
      const data = await messageService.deleteMessage(
        req.auth!.userId,
        req.params.conversationId,
        req.params.messageId,
        scope
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async hideConversation(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await messageService.hideConversationForMe(req.auth!.userId, req.params.conversationId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};