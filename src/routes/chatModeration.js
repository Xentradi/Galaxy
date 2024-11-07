import express from 'express';
import {captureAndModerate} from '../controllers/chatModerationController.js';

const router = express.Router();

// Endpoint for capturing and moderating chat messages
router.post('/chat-moderation', captureAndModerate);

export default router;
