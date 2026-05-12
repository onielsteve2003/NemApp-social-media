import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { storyController } from '../controllers/storyController';

const router = Router();

router.use(requireAuth);
router.get('/feed', storyController.feed);
router.get('/users/:userId', storyController.userStories);
router.post('/', storyController.create);
router.post('/:storyId/seen', storyController.seen);
router.post('/:storyId/like', storyController.like);
router.post('/:storyId/reshare', storyController.reshare);
router.delete('/:storyId', storyController.remove);

export default router;