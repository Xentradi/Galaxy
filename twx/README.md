# TWX - Modern Twitch API SDK

A modern TypeScript SDK for the Twitch API, designed to replace TMI.js with current API endpoints and best practices.

## Features

- Full TypeScript support
- Modern Twitch API (Helix) endpoints
- Promise-based API
- Automatic token management
- EventSub support
- Chat settings management
- Channel points integration
- Clips creation
- Moderation tools

## Installation

```bash
npm install twx
```

## Usage

### Basic Setup

```typescript
import { TwitchAuth, TwitchAPI } from 'twx';

const auth = new TwitchAuth({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'your-redirect-uri' // Optional, required for user authentication
});

const api = new TwitchAPI(auth);
```

### Examples

#### Get User Information
```typescript
const users = await api.getUsers({ login: ['username'] });
console.log(users.data[0]);
```

#### Get Live Streams
```typescript
const streams = await api.getStreams({
  user_login: ['username'],
  type: 'live'
});
console.log(streams.data);
```

#### Update Chat Settings
```typescript
const settings = await api.updateChatSettings(
  'broadcaster-id',
  'moderator-id',
  {
    slow_mode: true,
    slow_mode_wait_time: 30
  }
);
```

#### Create EventSub Subscription
```typescript
const subscription = await api.createEventSubSubscription(
  'channel.follow',
  '1',
  { broadcaster_user_id: 'broadcaster-id' },
  'https://your-callback-url.com/webhook'
);
```

#### Create Channel Points Reward
```typescript
const reward = await api.createCustomReward(
  'broadcaster-id',
  {
    title: 'Custom Reward',
    cost: 5000,
    prompt: 'Redeem this reward to...'
  }
);
```

## Authentication

### App Access Token
```typescript
const token = await auth.getAccessToken();
```

### User Access Token
```typescript
// Get authorization URL
const authUrl = auth.getAuthorizationUrl(['channel:read:subscriptions']);

// After user authorizes and you receive the code
const userToken = await auth.getUserAccessToken('authorization-code');
```

## Error Handling

The SDK uses standard error handling practices. All API calls are wrapped in try-catch blocks and will throw errors with descriptive messages.

```typescript
try {
  const users = await api.getUsers({ login: ['username'] });
} catch (error) {
  console.error('Failed to fetch users:', error);
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions for all API responses and parameters.

```typescript
import type { UserData, StreamData, ChatSettings } from 'twx';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
