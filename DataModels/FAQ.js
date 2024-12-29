import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Site',
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    phoneNo:{
        type: String,
        required: true
    }
   
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;