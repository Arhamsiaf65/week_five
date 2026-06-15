import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { chatController } from './ai.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/chat', chatController);

export default router;
