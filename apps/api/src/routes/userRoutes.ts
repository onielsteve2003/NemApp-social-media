import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { userController } from '../controllers/userController';

const router = Router();

router.use(requireAuth);
router.get('/me/relationships', userController.relationships);
router.get('/discover', userController.discover);
router.get('/search', userController.search);
router.patch('/me', userController.updateMe);
router.get('/:username/followers', userController.followers);
router.get('/:username/following', userController.following);
router.get('/:username', userController.profile);
router.post('/:userId/follow-toggle', userController.toggleFollow);

export default router;