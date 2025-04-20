// blogModel.js

import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true,
  },
  block: [
    {
      pic: {
        type: String, // URL or path to the picture
        required: false, // optional if not every block has a picture
      },
      content: {
        type: String,
        required: true,
      },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog;
