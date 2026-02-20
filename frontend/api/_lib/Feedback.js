import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxLength: 100 },
        rating: { type: Number, min: 1, max: 5, default: 3 },
        areasToImprove: [{ type: String, trim: true }],
        comments: { type: String, trim: true },
        page: { type: String, default: 'general' },
    },
    { timestamps: true }
);

export default mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
