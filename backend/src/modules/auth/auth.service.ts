import { createUser, getUserByEmail, getUserById } from '../../repositories/user.repository.js';
import { saveRefreshToken, getToken, deleteToken, deleteAllTokensForUser } from '../../repositories/token.repository.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';

export const registerService = async (name: string, email: string, passwordPlain: string) => {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
        throw new AppError('Email is already in use', 400);
    }

    const passwordHash = await hashPassword(passwordPlain);
    const user = await createUser(name, email, passwordHash);

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    
    // Store refresh token for 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(refreshToken, user.id, expiresAt);

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const loginService = async (email: string, passwordPlain: string) => {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    const isValid = await comparePassword(passwordPlain, user.password_hash);
    if (!isValid) {
        throw new AppError('Invalid credentials', 401);
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    
    // Store refresh token for 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(refreshToken, user.id, expiresAt);

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const refreshService = async (oldRefreshToken: string) => {
    const storedToken = await getToken(oldRefreshToken);
    
    if (!storedToken) {
        // Reuse detection could happen here if we logged revoked tokens instead of deleting them.
        // For now, if the token doesn't exist, they must re-authenticate.
        throw new AppError('Invalid refresh token', 401);
    }

    if (new Date() > storedToken.expires_at) {
        await deleteToken(oldRefreshToken);
        throw new AppError('Refresh token expired', 401);
    }

    // Token Rotation: Delete old, generate new
    await deleteToken(oldRefreshToken);

    const user = await getUserById(storedToken.user_id);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken();
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveRefreshToken(refreshToken, user.id, expiresAt);

    return { accessToken, refreshToken };
};

export const logoutService = async (refreshToken: string) => {
    await deleteToken(refreshToken);
};
