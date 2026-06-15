import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Application = express();
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests, please try again later.' } },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security and utility middleware
app.use(limiter);
app.use(helmet());
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'ArchitectAI' });
});

import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/auth.routes.js';
import conversationRoutes from './modules/conversations/conversations.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';

const swaggerDocument = JSON.parse(readFileSync(new URL('./swagger.json', import.meta.url), 'utf-8')) as any;

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/ai', aiRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global Error Handler
app.use(errorHandler);

export default app;
