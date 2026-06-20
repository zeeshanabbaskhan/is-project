/**
 * SecureTransfer Backend Server
 * Standalone entry point (Docker / local production)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import app from './app.js';
import connectDB from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on ${BASE_URL}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🔐 Encryption endpoints available at /api/crypto');
        });
    })
    .catch(err => {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    });

export default app;
