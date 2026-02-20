import { Router } from 'express';
import Feedback from '../models/Feedback.js';

const router = Router();

// POST /api/feedback — save a feedback entry
router.post('/feedback', async (req, res) => {
    try {
        const { name, rating, areasToImprove, comments, page } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

        const feedback = await Feedback.create({
            name: name.trim(),
            rating: rating || 3,
            areasToImprove: areasToImprove || [],
            comments: (comments || '').trim(),
            page: page || 'general',
        });

        res.status(201).json({ ok: true, id: feedback._id });
    } catch (err) {
        console.error('Feedback save error:', err);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

// GET /api/admin/feedbacks — fetch all feedbacks (admin only)
router.get('/admin/feedbacks', async (req, res) => {
    try {
        const key = req.headers['x-admin-key'];
        if (key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });

        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
        res.json(feedbacks);
    } catch (err) {
        console.error('Admin fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
});

// GET /api/admin/stats — quick summary stats
router.get('/admin/stats', async (req, res) => {
    try {
        const key = req.headers['x-admin-key'];
        if (key !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });

        const total = await Feedback.countDocuments();
        const avgRating = await Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);
        const areaBreakdown = await Feedback.aggregate([
            { $unwind: '$areasToImprove' },
            { $group: { _id: '$areasToImprove', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            totalFeedbacks: total,
            averageRating: avgRating[0]?.avg?.toFixed(1) || '—',
            topAreas: areaBreakdown.slice(0, 8),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
