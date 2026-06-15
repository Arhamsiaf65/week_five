import { Request, Response, NextFunction } from 'express';
import { registerService, loginService, refreshService, logoutService } from './auth.service.js';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const result = await registerService(name, email, password);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await loginService(email, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        const result = await refreshService(refreshToken);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Typically sent via body or cookies. We'll use body for this standard REST API
        const { refreshToken } = req.body;
        if (refreshToken) {
            await logoutService(refreshToken);
        }
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
