import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true,
  },
  permalink: {
    type: String,
    required: true,
    unique: true, // to prevent duplicate slugs
    lowercase: true,
    trim: true,
  },
  metaTitle: {
    type: String,
    required: false,
    trim: true,
  },
  metaDescription: {
    type: String,
    required: false,
    trim: true,
  },
  metaKeywords: {
    type: [String], // Array of keywords
    default: [],
  },
  author: {
    type: String,
    required: false,
    trim: true,
  },
  block: [
    {
      pic: {
        type: String,
        required: false,
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