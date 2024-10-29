import 'dotenv/config'
import express from 'express';
import moderationRoutes from './routes/moderation.js';
import config from './config/config.json' assert {type: 'json'};

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// API Key Authentication Middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = config.apiKey || process.env.API_KEY;
  if (apiKey && apiKey === validApiKey) {
    next();
  } else {
    res.status(403).json({message: 'Forbidden: Invalid API Key'});
  }
});

// User ID Validation Middleware
app.use((req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({message: 'User ID is required'});
  }
  req.userId = userId;
  next();
});

// Use moderation routes
app.use('/api', moderationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({message: 'Resource not found'});
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
