import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { createConversationController, getConversationsController, getConversationDetailsController, deleteConversationController } from './conversations.controller.js';

const router = Router();

router.use(requireAuth); // Protect all conversation routes

router.get('/', getConversationsController);
router.post('/', createConversationController);
router.get('/:id', getConversationDetailsController);
router.delete('/:id', deleteConversationController);

export default router;
