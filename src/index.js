import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import moderationRoutes from './routes/moderation.js';
import chatMessageRoutes from './routes/chatMessage.js';
import chatModerationRoutes from './routes/chatModeration.js';
import authRoutes from './routes/auth.js';
import {authenticateToken} from './middleware/authMiddleware.js';
import {connectDB} from './config/db.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Auth routes (unprotected)
app.use('/auth', authRoutes);

// OAuth Authentication Middleware for protected routes
app.use('/api', authenticateToken);

// User ID Validation Middleware
app.use('/api', (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({message: 'User ID is required'});
  }
  req.userId = userId;
  next();
});

// Protected API routes
app.use('/api', moderationRoutes);
app.use('/api', chatMessageRoutes);
app.use('/api', chatModerationRoutes);

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
  console.log(`Auth endpoint available at http://localhost:${port}/auth`);
  console.log(`Protected API endpoints available at http://localhost:${port}/api/*`);
});
