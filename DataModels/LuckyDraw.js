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
    },
    AdhaarNo: {
        type: String,
        required: true
    },
    PANno: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const LuckyDraw = mongoose.model('LuckyDraw', luckyDrawSchema);

export default LuckyDraw;