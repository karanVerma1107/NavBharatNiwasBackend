import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './connectionDB.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import path from 'path';



// Load environment variables from 0.env file
dotenv.config({ path: 'o.env' });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://navbharatniwas.in', // Your Netlify site
  credentials: true, // Allow credentials (cookies) to be sent
}));
app.use(express.json());

app.use(cookieParser());



// Define the path to the 'uploads' folder
const __filename = fileURLToPath(import.meta.url); // Get the file name
const __dirname = path.dirname(__filename); // Get the directory name

// Ensure the uploads folder is in the correct location
const uploadPath = path.join(__dirname, 'uploads');

// Serve files from the 'uploads' directory as static files
app.use('/uploads', express.static(uploadPath));

connectDB();

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

import Urouter from './routes/userRoutes.js';
app.use('/api/v1', Urouter);

import Srouter from './routes/SiteRoute.js';
app.use('/api/v1', Srouter);


app.use(errorHandler)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});