// blogModel.js

import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  instagramEmbedLink: {
    type: String,
    required: false
    
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog;
