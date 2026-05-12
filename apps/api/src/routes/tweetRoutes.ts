import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { tweetController } from '../controllers/tweetController';

const router = Router();

router.use(requireAuth);
router.get('/feed', tweetController.feed);
router.post('/', tweetController.create);
router.post('/:tweetId/replies', tweetController.reply);
router.patch('/:tweetId', tweetController.update);
router.delete('/:tweetId', tweetController.remove);
router.post('/:tweetId/like', tweetController.like);
router.post('/:tweetId/retweet', tweetController.retweet);
router.post('/:tweetId/bookmark', tweetController.bookmark);
router.post('/:tweetId/poll-vote', tweetController.votePoll);

export default router;