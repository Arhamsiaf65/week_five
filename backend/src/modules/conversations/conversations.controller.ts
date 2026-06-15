import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/requireAuth.js';
import { createConversation, getConversationsByUser, getConversationById, deleteConversation, getMessagesByConversation, getToolExecutionsByConversation } from '../../repositories/conversation.repository.js';
import { AppError } from '../../utils/AppError.js';

export const createConversationController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { title } = req.body;
        const conversation = await createConversation(userId, title || 'New Blueprint');
        res.status(201).json(conversation);
    } catch (error) {
        next(error);
    }
};

export const getConversationsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const conversations = await getConversationsByUser(userId);
        res.status(200).json(conversations);
    } catch (error) {
        next(error);
    }
};

export const getConversationDetailsController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        
        const conversation = await getConversationById(id, userId);
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }

        const messages = await getMessagesByConversation(id);
        const toolExecutions = await getToolExecutionsByConversation(id);

        res.status(200).json({
            ...conversation,
            messages,
            toolExecutions
        });
    } catch (error) {
        next(error);
    }
};

export const deleteConversationController = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id as string;
        await deleteConversation(id, userId);
        res.status(200).json({ message: 'Conversation deleted' });
    } catch (error) {
        next(error);
    }
};
