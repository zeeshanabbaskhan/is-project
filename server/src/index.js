/**
 * SecureTransfer Backend Server
 * Main entry point with Express configuration
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.routes.js';
import fileRoutes from './routes/file.routes.js';
import shareRoutes from './routes/share.routes.js';
import noteRoutes from './routes/note.routes.js';
import deviceRoutes from './routes/device.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import cryptoRoutes from './routes/crypto.routes.js';

// Load environment variables from root .env file
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || './uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadsDir);
}

// Client build path (for production)
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(clientBuildPath);

// CORS origin configuration
const corsOrigin = isProduction ? false : (process.env.CLIENT_URL || 'http://localhost:5173');

// Middleware
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
    const encrypted = req.headers['x-encrypted-request'] === 'true';
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path} ${encrypted ? '🔐' : ''}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crypto', cryptoRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from client build in production
if (fs.existsSync(clientBuildPath)) {
    console.log('📦 Serving client from:', clientBuildPath);
    app.use(express.static(clientBuildPath));

    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/securetransfer';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        console.log(`   Database: ${MONGODB_URI.split('/').pop().split('?')[0]}`);
        app.listen(PORT, () => {
            console.log(`🚀 Server running on ${BASE_URL}`);
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🔐 Encryption endpoints available at /api/crypto');
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

export default app;
