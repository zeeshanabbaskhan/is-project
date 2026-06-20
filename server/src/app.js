/**
 * SecureTransfer Express Application
 * Shared between standalone server and Vercel serverless
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import authRoutes from './routes/auth.routes.js';
import fileRoutes from './routes/file.routes.js';
import shareRoutes from './routes/share.routes.js';
import noteRoutes from './routes/note.routes.js';
import deviceRoutes from './routes/device.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import cryptoRoutes from './routes/crypto.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);

// Create uploads directory if it doesn't exist (local/Docker only)
if (!isVercel) {
    const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || './uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory:', uploadsDir);
    }
}

const clientBuildPath = process.env.CLIENT_DIST_PATH || path.join(__dirname, '..', '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(clientBuildPath);

const corsOrigin = isVercel || isProduction
    ? true
    : (process.env.CLIENT_URL || 'http://localhost:5173');

const app = express();

app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use((req, res, next) => {
    const encrypted = req.headers['x-encrypted-request'] === 'true';
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path} ${encrypted ? '🔐' : ''}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crypto', cryptoRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        platform: isVercel ? 'vercel' : 'standalone'
    });
});

// Serve static client build when running as a single server (Docker/local production)
if (!isVercel && fs.existsSync(clientBuildPath)) {
    console.log('📦 Serving client from:', clientBuildPath);
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

export default app;
