# GalaxyGuard Integration Guide

This guide explains how to integrate the local GalaxyGuard SDK with your Twitch bot for chat moderation and logging.

## Project Setup

1. Ensure the SDK is in your project:
```
your-twitch-bot/
├── src/
│   ├── gg/                    # GalaxyGuard SDK
│   │   ├── services/          # API services
│   │   ├── utils/             # Utilities
│   │   ├── errors.js         
│   │   ├── index.js          
│   │   ├── tokenManager.js   
│   │   └── types.js         
│   └── bot.js                 # Your bot implementation
├── package.json
└── .env
```

2. Add required dependencies to your package.json:
```json
{
  "type": "module",
  "dependencies": {
    "axios": "^1.x.x",
    "dotenv": "^16.x.x"
  }
}
```

3. Install dependencies:
```bash
npm install
```

## Environment Setup

Create a `.env` file in your project root:

```env
GALAXYGUARD_API_URL=https://your-api-url
GALAXYGUARD_CLIENT_ID=your_client_id
GALAXYGUARD_CLIENT_SECRET=your_client_secret
GALAXYGUARD_MODE=moderate  # or 'log' for logging only
```

## Basic Integration

In your bot.js file:

```javascript
import 'dotenv/config';
import { GalaxyGuard, Mode, withRetry } from './gg/index.js';

// Initialize the client
const guard = new GalaxyGuard({
  apiUrl: process.env.GALAXYGUARD_API_URL,
  clientId: process.env.GALAXYGUARD_CLIENT_ID,
  clientSecret: process.env.GALAXYGUARD_CLIENT_SECRET,
  mode: process.env.GALAXYGUARD_MODE || Mode.MODERATE
});

// In your message handler
async function onChatMessage(message, channel) {
  try {
    const result = await withRetry(() => 
      guard.messages.handleMessage(
        {
          content: message.content,
          channelType: 'twitch',
          userId: message.userId,
          username: message.username
        },
        { id: channel.id }
      )
    );

    if (guard.mode === Mode.MODERATE) {
      handleModerationResult(result);
    }
  } catch (error) {
    handleError(error);
  }
}
```

## Error Handling

```javascript
import {
  GalaxyGuardError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError
} from './gg/index.js';

function handleError(error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, reset at:', error.resetTime);
    // Implement backoff strategy
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
    // Handle token issues
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.details);
    // Fix request data
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    // Handle connectivity issues
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Moderation Handler

```javascript
import { ModerationAction } from './gg/index.js';

function handleModerationResult(result) {
  const { moderation } = result;

  switch (moderation.action) {
    case ModerationAction.DELETE:
      // Delete message
      deleteMessage(result.message._id);
      logModeration(result, 'Message deleted');
      break;

    case ModerationAction.WARN:
      // Warn user
      warnUser(
        result.message.username,
        moderation.analysis.flaggedCategory
      );
      logModeration(result, 'User warned');
      break;

    case ModerationAction.ALLOW:
      // Message is safe
      logModeration(result, 'Message allowed');
      break;
  }
}
```

## Advanced Features

### Channel History

```javascript
async function getChannelHistory(channelId) {
  try {
    const messages = await guard.messages.getChannelMessages(
      channelId,
      {
        limit: 100,
        before: new Date().toISOString()
      }
    );

    return messages;
  } catch (error) {
    handleError(error);
    return [];
  }
}
```

### Mode Switching

```javascript
function setMode(mode) {
  try {
    guard.setMode(mode);
    console.log(`Switched to ${mode} mode`);
  } catch (error) {
    console.error('Invalid mode:', error.message);
  }
}
```

### Batch Processing

```javascript
async function processBatch(messages, channel) {
  const results = await Promise.allSettled(
    messages.map(msg => 
      withRetry(() => guard.messages.handleMessage(msg, channel))
    )
  );

  return results.map((result, index) => ({
    message: messages[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : result.reason
  }));
}
```

## Best Practices

1. **SDK Updates**
   - Keep the SDK code in your project's repository
   - Update the SDK code directly in the `src/gg` directory
   - Test changes thoroughly before deploying

2. **Error Handling**
   - Implement comprehensive error handling
   - Use appropriate error types
   - Log errors with context

3. **Performance**
   - Reuse the client instance
   - Implement rate limiting
   - Use retries with backoff

4. **Security**
   - Store credentials in .env
   - Never commit .env files
   - Keep the SDK private

5. **Testing**
   - Test both moderation and logging modes
   - Verify error handling
   - Test rate limit handling

## Common Issues

1. **Authentication**
   - Ensure credentials are correct
   - Check token expiration
   - Verify API URL

2. **Rate Limiting**
   - Implement proper backoff
   - Monitor usage patterns
   - Cache when possible

3. **Network Issues**
   - Use retry mechanism
   - Implement circuit breaker
   - Log connection errors

4. **Data Validation**
   - Validate input data
   - Handle special characters
   - Check message lengths

## Version Control

1. Add the following to your .gitignore:
```gitignore
.env
node_modules/
```

2. Commit the SDK code with your project:
```bash
git add src/gg
git commit -m "Update GalaxyGuard SDK"
```

## Development Workflow

1. Make changes to the SDK in `src/gg`
2. Test changes with your bot
3. Commit changes to your project repository
4. Deploy your bot with the updated SDK
