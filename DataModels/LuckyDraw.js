import mongoose from 'mongoose';

const luckyDrawSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    siteName: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const LuckyDraw = mongoose.model('LuckyDraw', luckyDrawSchema);

export default LuckyDraw;