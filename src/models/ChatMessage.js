import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // Message Information
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },

  // User Information
  username: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },

  // Channel Information
  channelName: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },

  // Moderation Information
  wasModerated: {
    type: Boolean,
    default: false,
  },
  moderationType: {
    type: String,
    enum: ['none', 'timeout', 'ban', 'deletion', 'warning'],
    default: 'none',
  },
  moderationReason: {
    type: String,
    default: null,
  },
  moderatedBy: {
    type: String,
    default: null,  // Can be either bot ID or human moderator username
  },
  moderatedAt: {
    type: Date,
    default: null,
  },

  // Additional Context
  messageType: {
    type: String,
    enum: ['chat', 'whisper', 'action', 'announcement'],
    default: 'chat',
  },
  badges: [{
    type: String,
  }],
  emotes: [{
    id: String,
    name: String,
    positions: [Number],
  }],

  // Training Labels (for AI)
  toxicityScore: {
    type: Number,
    min: 0,
    max: 1,
    default: null,
  },
  categories: [{
    type: String,
    enum: [
      'spam',
      'hate_speech',
      'harassment',
      'sexual_content',
      'violence',
      'self_harm',
      'misinformation',
      'other',
      'none'
    ],
  }],

  // Metadata
  platform: {
    type: String,
    default: 'twitch',
  },
  raw: {
    type: mongoose.Schema.Types.Mixed,  // Store raw message data for future reference
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt
});

// Indexes for common queries
chatMessageSchema.index({channelId: 1, timestamp: -1});
chatMessageSchema.index({wasModerated: 1});
chatMessageSchema.index({username: 1});
chatMessageSchema.index({userId: 1});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
