import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { messageController } from '../controllers/messageController';

const router = Router();

router.use(requireAuth);
router.get('/conversations', messageController.conversations);
router.post('/conversations/open', messageController.open);
router.post('/conversations/:conversationId/messages', messageController.send);
router.post('/conversations/:conversationId/read', messageController.read);
router.post('/conversations/:conversationId/hide', messageController.hideConversation);
router.patch('/conversations/:conversationId/messages/:messageId', messageController.editMessage);
router.delete('/conversations/:conversationId/messages/:messageId', messageController.deleteMessage);

export default router;