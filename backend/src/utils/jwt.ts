import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    role: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as jwt.SignOptions);
};

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString('hex');
};

export const verifyAccessToken = (token: string): TokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret);

        if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
            throw new Error('Invalid token payload');
        }

        const payload = decoded as { userId?: unknown; role?: unknown };

        if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') {
            throw new Error('Invalid token payload');
        }

        return { userId: payload.userId, role: payload.role };
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
