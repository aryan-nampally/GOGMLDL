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
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
        res.json(feedbacks);
    } catch (err) {
        console.error('Admin fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
}
