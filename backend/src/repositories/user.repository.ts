import { pool } from '../utils/db.js';

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: Date;
}

export const createUser = async (name: string, email: string, passwordHash: string): Promise<User> => {
    const result = await pool.query<User>(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, email, passwordHash]
    );
    return result.rows[0];
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
    const result = await pool.query<User>(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
};
