import 'dotenv/config';
import app from './app.js';
import { pool } from './utils/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Check DB connection
        await pool.query('SELECT 1');
        console.log('✅ Connected to PostgreSQL');

        app.listen(PORT, () => {
            console.log(`🚀 ArchitectAI Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
