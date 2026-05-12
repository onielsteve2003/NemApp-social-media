import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../middleware/authMiddleware';
import { tweetService } from '../services/tweetService';

export const tweetController = {
  async feed(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page ?? 0);
      const limit = Number(req.query.limit ?? 20);
      const mode = req.query.mode === 'following' ? 'following' : 'for-you';
      const data = await tweetService.getFeed(req.auth!.userId, page, limit, mode);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const tweet = await tweetService.createTweet(req.auth!.userId, req.body ?? {});
      res.status(201).json({ success: true, data: { tweet } });
    } catch (error) {
      next(error);
    }
  },

  async reply(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const tweet = await tweetService.createReply(req.auth!.userId, req.params.tweetId, req.body ?? {});
      res.status(201).json({ success: true, data: { tweet } });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const tweet = await tweetService.updateTweet(req.auth!.userId, req.params.tweetId, req.body ?? {});
      res.json({ success: true, data: { tweet } });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await tweetService.deleteTweet(req.auth!.userId, req.params.tweetId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async like(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await tweetService.toggleLike(req.auth!.userId, req.params.tweetId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async retweet(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await tweetService.toggleRetweet(req.auth!.userId, req.params.tweetId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async bookmark(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const data = await tweetService.toggleBookmark(req.auth!.userId, req.params.tweetId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async votePoll(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
      const poll = await tweetService.votePoll(req.auth!.userId, req.params.tweetId, req.body?.optionId);
      res.json({ success: true, data: { poll } });
    } catch (error) {
      next(error);
    }
  },
};