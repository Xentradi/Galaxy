import express from 'express';
import {
  storeChatMessage,
  updateModeration,
  getChannelMessages,
  getTrainingData,
} from '../controllers/chatMessageController.js';

const router = express.Router();

// Store new chat message
router.post('/messages', storeChatMessage);

// Update moderation status
router.patch('/messages/:messageId/moderation', updateModeration);

// Get messages for a channel
router.get('/channels/:channelId/messages', getChannelMessages);

// Get training data
router.get('/training-data', getTrainingData);

export default router;
