# Development Guide

This guide provides information for developers working on or integrating with GalaxyGuard.

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── config.js     # Main configuration
│   │   └── db.js        # Database configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── index.js         # Application entry point
├── .env-sample          # Environment variables template
└── package.json         # Project dependencies
```

## Development Setup

1. **Environment Setup**
   ```bash
   # Install dependencies
   npm install

   # Copy environment template
   cp .env-sample .env

   # Start development server
   npm run dev
   ```

2. **Database Setup**
   ```javascript
   // src/config/db.js
   import mongoose from 'mongoose';

   mongoose.connect(process.env.DATABASE_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true
   });
   ```

## Code Style Guidelines

### 1. JavaScript Conventions

- Use ES6+ features
- Async/await for asynchronous operations
- Proper error handling
- Clear variable and function naming

Example:
```javascript
// Good
async function getUserHistory(userId) {
  try {
    return await UserHistory.findOne({ userId });
  } catch (error) {
    throw new Error(`Failed to get user history: ${error.message}`);
  }
}

// Avoid
function getHistory(id) {
  return UserHistory.findOne({ userId: id })
    .then(history => history)
    .catch(err => console.error(err));
}
```

### 2. API Route Structure

```javascript
// src/routes/example.js
import express from 'express';
const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
```

### 3. Controller Pattern

```javascript
// src/controllers/exampleController.js
export const create = async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

## Error Handling

### 1. Custom Error Classes

```javascript
// src/errors.js
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}
```

### 2. Error Middleware

```javascript
// src/middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({ message });
};
```

## Testing

### 1. Unit Tests

```javascript
// Example test using Jest
describe('UserHistory Service', () => {
  it('should create user history', async () => {
    const data = {
      userId: 'user123',
      action: 'message'
    };
    const result = await userHistoryService.create(data);
    expect(result.userId).toBe(data.userId);
  });
});
```

### 2. Integration Tests

```javascript
// API endpoint test
describe('POST /messages', () => {
  it('should store message', async () => {
    const response = await request(app)
      .post('/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Test message',
        channelId: 'channel123'
      });
    expect(response.status).toBe(201);
  });
});
```

## API Integration

### 1. Client Implementation

```javascript
// Example client implementation
class GalaxyGuardClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.baseURL || 'http://localhost:3000';
    this.setupAxios();
  }

  async authenticate() {
    const response = await this.axios.post('/auth/oauth/token', {
      grant_type: 'client_credentials'
    });
    this.setToken(response.data.access_token);
  }
}
```

### 2. Error Handling

```javascript
// Client-side error handling
try {
  await client.moderateContent(message);
} catch (error) {
  if (error.response?.status === 429) {
    // Handle rate limit
    await delay(error.response.headers['retry-after']);
  } else {
    // Handle other errors
    console.error('Moderation failed:', error.message);
  }
}
```

## Database Operations

### 1. Model Definition

```javascript
// src/models/ChatMessage.js
import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  moderation: {
    status: String,
    action: String,
    timestamp: Date
  }
});

export default mongoose.model('ChatMessage', chatMessageSchema);
```

### 2. Repository Pattern

```javascript
// src/repositories/chatMessageRepository.js
export class ChatMessageRepository {
  async create(data) {
    return await ChatMessage.create(data);
  }

  async findByChannel(channelId, options = {}) {
    return await ChatMessage.find({ channelId })
      .sort({ timestamp: -1 })
      .limit(options.limit || 100);
  }
}
```

## Moderation Implementation

### 1. Content Analysis

```javascript
// src/services/moderationService.js
export class ModerationService {
  async analyzeContent(content) {
    const scores = await this.openAI.analyze(content);
    return this.evaluateScores(scores);
  }

  evaluateScores(scores) {
    const thresholds = config.moderation.thresholds;
    return Object.entries(scores).reduce((result, [category, score]) => {
      result[category] = this.getLevel(score, thresholds[category]);
      return result;
    }, {});
  }
}
```

### 2. Action Handling

```javascript
// src/services/actionService.js
export class ActionService {
  async handleViolation(userId, violation) {
    const history = await this.userHistory.getStrikes(userId);
    const action = this.determineAction(history, violation);
    await this.executeAction(userId, action);
    return action;
  }
}
```

## Deployment

### 1. Production Build

```bash
# Build process
npm run build

# Start production server
NODE_ENV=production npm start
```

### 2. Environment Configuration

```bash
# Production environment setup
export NODE_ENV=production
export PORT=3000
export DATABASE_URI=mongodb://prod-host/galaxy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## Documentation

- Keep API documentation updated
- Document code changes
- Update configuration guides
- Maintain changelog
