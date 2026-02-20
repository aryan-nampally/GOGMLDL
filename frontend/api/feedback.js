import dbConnect from './_lib/db.js';
import Feedback from './_lib/Feedback.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await dbConnect();
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
}
