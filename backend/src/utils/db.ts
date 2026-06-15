import { Pool } from 'pg';
import 'dotenv/config';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_NAME,
    // password: process.env.DB_PASSWORD,
    // port: parseInt(process.env.DB_PORT || '5432'),
});

// For Render deployment we might need SSL
if (process.env.NODE_ENV === 'production') {
    pool.options.ssl = {
        rejectUnauthorized: false
    };
}
