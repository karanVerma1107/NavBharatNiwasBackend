import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './connectionDB.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: 'o.env' });

const app = express();
const port = process.env.PORT || 3000;

// Set allowed origins (both with and without www)
const allowedOrigins = [
  'https://navbharatniwas.in',
  'https://www.navbharatniwas.in'
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from both the domains and no origin (for localhost testing)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Dynamic CORS middleware to handle setting headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin); // Dynamically set the origin from the request header
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Define the path to the 'uploads' folder
const __filename = fileURLToPath(import.meta.url); // Get the file name
const _dirname = path.dirname(_filename); // Get the directory name

// Ensure the uploads folder is in the correct location
const uploadPath = path.join(__dirname, 'uploads');

// Serve files from the 'uploads' directory as static files
app.use('/uploads', express.static(uploadPath));

// Connect to the database
connectDB();

// Basic route to test if server is working
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Routes for user and site
import Urouter from './routes/userRoutes.js';
app.use('/api/v1', Urouter);

import Srouter from './routes/SiteRoute.js';
app.use('/api/v1', Srouter);

// Error handler middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});