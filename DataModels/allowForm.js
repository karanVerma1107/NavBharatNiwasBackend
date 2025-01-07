import mongoose from 'mongoose';
import { type } from 'os';

// Define the IsAllow schema
const isAllowSchema = new mongoose.Schema({
    // The name of the form set by the admin
    formName: {
        type: String,
        required: true
    },
    // The date when the form will be opened for submissions
    formOpeningDate: {
        type: Date,
        required: true
    },
    // Flag indicating whether the form is enabled or not
    isEnabled: {
        type: Boolean,
        default: false // Form is disabled by default
    },
    // Reference to the LuckyDraw form that users will fill
    luckydraw: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LuckyDraw',
        
    }],
    // Reference to the user/admin who enabled this form
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming 'User' model is used for admins/users
        required: true
    },
    result:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming 'User' model is used for admins/users
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const IsAllow = mongoose.model('IsAllow', isAllowSchema);

export default IsAllow;
