import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNo:{
        type: String,
        required: true
    },
    budget:{
        type: String,
        required: true,
        enum: [
            '10 lakh to 20 lakh',
            '30 lakh to 40 lakh',
            '3 crore to 4 crore'
        ]
    }

   
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;