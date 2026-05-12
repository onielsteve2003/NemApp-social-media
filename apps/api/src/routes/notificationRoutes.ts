import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { notificationController } from '../controllers/notificationController';

const router = Router();

router.use(requireAuth);
router.get('/', notificationController.list);
router.post('/read-all', notificationController.readAll);
router.post('/:notificationId/read', notificationController.read);
router.delete('/clear', notificationController.clear);

export default router;