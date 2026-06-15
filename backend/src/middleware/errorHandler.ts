import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';

type ErrorLike = {
    statusCode?: number;
    message?: string;
    code?: string;
};

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    const defaultMessage = 'Internal Server Error';
    let statusCode = 500;
    let message = defaultMessage;
    let errors: Array<{ path: string; message: string }> | undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
    } else if (typeof err === 'object' && err !== null && 'code' in err && (err as ErrorLike).code === '23505') {
        statusCode = 409;
        message = 'Duplicate field value entered';
    } else if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as ErrorLike).message === 'string') {
        message = (err as ErrorLike).message || defaultMessage;
    }

    if (process.env.NODE_ENV === 'development') {
        console.error('[Error]:', err);
    }

    res.status(statusCode).json({
        error: {
            message,
            ...(errors ? { details: errors } : {}),
        },
    });
};
