import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images:[{
    type: String,
    required: true
}],
  current: {
    type: String,
    enum: ['ongoing', 'upcoming', 'testimonial'],
    required: true
  },
  formYes: {
    type: Boolean,
    required: true,
    default: false
  },
  postedBy:{
    type: String,
    ref: 'User',
    required: true
  }

}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Site = mongoose.model('Site', siteSchema);

export default Site;