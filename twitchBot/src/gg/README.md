# GalaxyGuard SDK

A private SDK for interacting with the GalaxyGuard API. This SDK is designed to be used as a local module within your project.

## Local Usage

Since GalaxyGuard is a private API, this SDK should be kept within your project structure rather than published to npm.

### Project Structure

```
your-twitch-bot/
├── src/
│   ├── gg/                    # GalaxyGuard SDK (this directory)
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

### Import in Your Code

```javascript
// Import the SDK from your local project
import { GalaxyGuard, Mode } from './gg/index.js';

// Initialize the client
const guard = new GalaxyGuard({
  apiUrl: process.env.GALAXYGUARD_API_URL,
  clientId: process.env.GALAXYGUARD_CLIENT_ID,
  clientSecret: process.env.GALAXYGUARD_CLIENT_SECRET,
  mode: Mode.MODERATE
});
```

## Features

- Full TypeScript support with JSDoc comments
- Automatic token management and refresh
- Configurable retry logic with exponential backoff
- Comprehensive error handling
- Support for both moderation and logging modes

## API Reference

### Configuration

```javascript
const config = {
  apiUrl: string,          // GalaxyGuard API URL
  clientId: string,        // OAuth client ID
  clientSecret: string,    // OAuth client secret
  mode?: 'moderate'|'log'  // Operation mode (default: 'moderate')
};
```

### Message Handling

```javascript
// Moderate/log a message
const result = await guard.messages.handleMessage(message, channel);

// Get channel messages
const messages = await guard.messages.getChannelMessages(channelId, {
  limit: 100,
  before: '2023-01-01T00:00:00Z'
});

// Update moderation status
const updated = await guard.messages.updateModeration(messageId, {
  action: 'warn',
  reason: 'Inappropriate content',
  moderatorId: 'mod123'
});
```

### Error Handling

```javascript
import { 
  GalaxyGuardError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  APIError
} from './gg/index.js';

try {
  await guard.messages.handleMessage(message, channel);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
    console.log('Rate limit exceeded, reset at:', error.resetTime);
  } else if (error instanceof AuthenticationError) {
    // Handle authentication issues
    console.log('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Invalid request:', error.details);
  }
}
```

### Retry Logic

```javascript
import { withRetry, makeRetryable } from './gg/index.js';

// Use retry wrapper
const result = await withRetry(
  () => guard.messages.handleMessage(message, channel)
);

// Or make a function retryable
const handleMessageWithRetry = makeRetryable(
  guard.messages.handleMessage.bind(guard.messages)
);
```

## Best Practices

1. **Error Handling**
   - Always wrap API calls in try/catch blocks
   - Handle specific error types appropriately
   - Use retry logic for transient failures

2. **Configuration**
   - Store credentials in .env file
   - Never commit credentials to version control
   - Use different credentials for development/production

3. **Performance**
   - Reuse client instances
   - Implement rate limiting on your side
   - Use pagination for large data sets

4. **Monitoring**
   - Log API responses
   - Track rate limits
   - Monitor token refreshes

## Version Control

Since this is a private SDK:

1. Keep the SDK code in your project's repository
2. Include it in your project's .gitignore if you want to maintain it as a separate private repository
3. Consider using git submodules if you want to share the SDK across multiple projects while keeping it private

## Updating the SDK

To update the SDK:

1. Make changes directly in the `src/gg` directory
2. Test changes with your bot implementation
3. If using git submodules, commit and push changes to the SDK repository
4. Update the submodule reference in your main project

## Security Considerations

1. Keep your client credentials secure
2. Don't share the SDK code publicly
3. Regularly audit the code for security issues
4. Keep dependencies up to date
