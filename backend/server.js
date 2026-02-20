import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import feedbackRoutes from './routes/feedback.js';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = (process.env.MONGO_URI || '').trim();
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || '').trim();

app.use(
    cors({
        origin: FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-admin-key'],
    })
);
app.use(express.json());

// Routes
app.use('/api', feedbackRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB then start server
if (!MONGO_URI) {
    console.error('❌ Missing MONGO_URI environment variable');
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err?.message || err);
        process.exit(1);
    });
