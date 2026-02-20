import dbConnect from '../_lib/db.js';
import Feedback from '../_lib/Feedback.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = req.headers['x-admin-key'];
    if (key !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        await dbConnect();

        const total = await Feedback.countDocuments();
        const avgRating = await Feedback.aggregate([
            { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]);
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
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}
