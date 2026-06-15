import { pool } from '../utils/db.js';

export interface RefreshToken {
    token: string;
    user_id: string;
    expires_at: Date;
    created_at: Date;
}

export const saveRefreshToken = async (token: string, userId: string, expiresAt: Date): Promise<void> => {
    await pool.query(
        `INSERT INTO refresh_tokens (token, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [token, userId, expiresAt]
    );
};

export const getToken = async (token: string): Promise<RefreshToken | null> => {
    const result = await pool.query<RefreshToken>(
        `SELECT * FROM refresh_tokens WHERE token = $1`,
        [token]
    );
    return result.rows[0] || null;
};

export const deleteToken = async (token: string): Promise<void> => {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE token = $1`,
        [token]
    );
};

export const deleteAllTokensForUser = async (userId: string): Promise<void> => {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE user_id = $1`,
        [userId]
    );
};
