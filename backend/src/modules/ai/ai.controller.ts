import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { chatStreamService } from './ai.service.js';
import { getConversationById } from '../../repositories/conversation.repository.js';
import { AppError } from '../../utils/AppError.js';

export const chatController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { conversationId, message } = req.body;

        if (!conversationId || !message) {
            throw new AppError('conversationId and message are required', 400);
        }

        const conversation = await getConversationById(conversationId, userId);
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        await chatStreamService(conversationId, message, res);

    } catch (error) {
        next(error);
    }
};
