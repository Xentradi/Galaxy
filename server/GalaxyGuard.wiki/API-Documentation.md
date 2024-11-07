# API Documentation

This document outlines the available API endpoints and how to use them.

## Authentication

GalaxyGuard uses OAuth 2.0 with the Client Credentials grant type for API authentication.

### Creating Client Credentials

```http
POST /auth/clients
```

Request body:
```json
{
  "name": "Your Client Name",
  "scope": ["read", "write"]  // Optional, defaults to ["read"]
}
```

Response:
```json
{
  "clientId": "generated_client_id",
  "clientSecret": "generated_client_secret",
  "name": "Your Client Name",
  "scope": ["read", "write"]
}
```

**Important**: Store the `clientSecret` securely as it won't be shown again.

### Obtaining Access Token

```http
POST /auth/oauth/token
```

Request body:
```json
{
  "grant_type": "client_credentials"
}
```

Include client credentials in Basic Auth header:
```
Authorization: Basic base64(clientId:clientSecret)
```

Response:
```json
{
  "access_token": "jwt_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## Message Endpoints

### Store Chat Message

```http
POST /messages
Authorization: Bearer <access_token>
```

Request body:
```json
{
  "content": "Message content",
  "channelType": "twitch",
  "channelId": "channel_identifier",
  "userId": "user_identifier",
  "username": "user_name"
}
```

### Get Channel Messages

```http
GET /channels/:channelId/messages
Authorization: Bearer <access_token>
```

Query parameters:
- `limit`: Number of messages to return
- `before`: Get messages before this timestamp
- `after`: Get messages after this timestamp

### Update Message Moderation

```http
PATCH /messages/:messageId/moderation
Authorization: Bearer <access_token>
```

Request body:
```json
{
  "action": "warn|mute|ban",
  "reason": "Reason for moderation action",
  "moderatorId": "moderator_identifier"
}
```

## Moderation Endpoints

### Moderate Content

```http
POST /moderate
Authorization: Bearer <access_token>
```

Request body:
```json
{
  "content": "Content to moderate"
}
```

Response includes moderation scores and recommended actions based on configured thresholds.

### Real-time Chat Moderation

```http
POST /chat-moderation
Authorization: Bearer <access_token>
```

Request body:
```json
{
  "content": "Message content",
  "channelType": "twitch",
  "channelId": "channel_identifier",
  "userId": "user_identifier",
  "username": "user_name"
}
```

Response includes both moderation results and message storage confirmation.

## Client Implementation Example

Here's an example of how to implement a client using the GalaxyGuard API:

```javascript
import {MessageService} from './services/messageService';
import {Mode} from './types';

// Initialize client with credentials
const client = new GalaxyGuardClient({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  mode: Mode.MODERATE  // or Mode.STORE for message storage only
});

const messageService = new MessageService(client);

// Handle a chat message
await messageService.handleMessage({
  content: 'Hello world!',
  channelType: 'twitch',
  userId: 'user123',
  username: 'chatuser'
}, {
  id: 'channel123'
});

// Get channel messages
const messages = await messageService.getChannelMessages('channel123', {
  limit: 100,
  before: new Date().toISOString()
});

// Update moderation status
await messageService.updateModeration('message123', {
  action: 'warn',
  reason: 'Inappropriate language',
  moderatorId: 'mod123'
});
```

## Error Handling

The API uses standard HTTP status codes and returns error responses in the following format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}  // Optional additional error details
}
```

Common error codes:
- 400: Bad Request - Invalid parameters or request body
- 401: Unauthorized - Invalid or missing authentication
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side error

## Rate Limiting

The API implements rate limiting based on client credentials. Current limits are:
- 100 requests per minute for message endpoints
- 50 requests per minute for moderation endpoints

Exceeded rate limits will return a 429 status code with a Retry-After header.
