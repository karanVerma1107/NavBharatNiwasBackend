import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './connectionDB.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';  // Import https module
import fs from 'fs';  // Import fs module to read certificate files

// Load environment variables from .env file
dotenv.config({ path: 'o.env' });

const app = express();
const port = process.env.PORT || 3000;


const allowedOrigins = [
  'https://www.navbharatniwas.in', // Allow HTTPS with www
  'https://navbharatniwas.in'      // Allow HTTPS without www
];

app.use(cors({
  origin: function(origin, callback) {
    // Check if the incoming origin is in the allowed origins list
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS'), false); // Reject the request
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use((req, res, next) => {
  const allowedOrigins = [
    'https://www.navbharatniwas.in',
    'https://navbharatniwas.in'
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
    res.header('Access-Control-Allow-Origin', origin); // Dynamically set the origin
  }
  
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
const __dirname = path.dirname(__filename); // Get the directory name

// Ensure the uploads folder is in the correct location
const uploadPath = path.join(__dirname, 'uploads');

// Serve files from the 'uploads' directory as static files
app.use('/uploads', express.static(uploadPath));

// Connect to the database
connectDB();

// Basic route to test if server is working
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// Routes for user and site
import Urouter from './routes/userRoutes.js';
app.use('/api/v1', Urouter);

import Srouter from './routes/SiteRoute.js';
app.use('/api/v1', Srouter);

// Error handler middleware
app.use(errorHandler);

const privateKey = fs.readFileSync('/etc/letsencrypt/live/navbharatniwas.in/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/navbharatniwas.in/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/navbharatniwas.in/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca, // Optional, depending on your setup
};


// Start the HTTPS server
https.createServer(credentials, app).listen(3008, () => {
  console.log('HTTPS server running on port 3008');
});