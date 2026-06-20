/**
 * Vercel serverless entry point
 * Routes all /api/* requests to the Express app
 */

import app from '../server/src/app.js';
import connectDB from '../server/src/db.js';

export default async function handler(req, res) {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        console.error('Serverless handler error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
}
