# GalaxyGuard Integration Guide

This guide explains how to integrate GalaxyGuard's moderation services into Galaxias.

## Configuration

The following environment variables have been added to `.env`:

```env
GALAXYGUARD_URL=http://localhost:3000
GALAXYGUARD_CLIENT_ID=9caa509e6d64fd941cf5efd4d0dbf983
GALAXYGUARD_CLIENT_SECRET=3c421297d0acfe4cecb0bd77a7b7dedc22eb562c643bef7a9fe4ea8d646645f9
```

## Token Management

Create a token manager to handle caching and refreshing of the access token:

```javascript
class GalaxyGuardTokenManager {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    // Add 5 minute buffer before expiry to ensure token is still valid during requests
    this.expiryBuffer = 5 * 60 * 1000; 
  }

  async getToken() {
    // Return cached token if it's still valid
    if (this.token && this.tokenExpiry && Date.now() < (this.tokenExpiry - this.expiryBuffer)) {
      return this.token;
    }

    // Get new token if none exists or current one is expired/expiring soon
    const response = await fetch(`${process.env.GALAXYGUARD_URL}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.GALAXYGUARD_CLIENT_ID}:${process.env.GALAXYGUARD_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });
    
    const data = await response.json();
    
    // Cache the token and set expiry (tokens expire in 1 hour)
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour in milliseconds
    
    return this.token;
  }
}

// Create a single instance to be used throughout the application
const tokenManager = new GalaxyGuardTokenManager();
```

## GalaxyGuard API Client

Create a client to handle all GalaxyGuard API interactions:

```javascript
class GalaxyGuardClient {
  constructor(tokenManager) {
    this.tokenManager = tokenManager;
  }

  async request(endpoint, options = {}) {
    const token = await this.tokenManager.getToken();
    
    const response = await fetch(`${process.env.GALAXYGUARD_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GalaxyGuard API error: ${response.status}`);
    }

    return response.json();
  }

  async moderateMessage(content, channelId, userId, channelType = 'normal') {
    return this.request('/moderation/moderate', {
      method: 'POST',
      body: JSON.stringify({
        content,
        channelId,
        userId,
        channelType
      })
    });
  }

  async storeMessage(message) {
    return this.request('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: message.content,
        username: message.username,
        userId: message.userId,
        channelName: message.channelName,
        channelId: message.channelId,
        messageType: message.type,
        badges: message.badges,
        emotes: message.emotes,
        platform: 'twitch',
        raw: message
      })
    });
  }

  async getChannelMessages(channelId, options = {}) {
    const queryParams = new URLSearchParams({
      limit: options.limit || 100,
      skip: options.skip || 0,
      startDate: options.startDate,
      endDate: options.endDate,
      moderatedOnly: options.moderatedOnly
    });

    return this.request(`/chat/channels/${channelId}/messages?${queryParams}`);
  }
}

// Create a single instance to be used throughout the application
const galaxyGuard = new GalaxyGuardClient(tokenManager);
```

## Usage Example

```javascript
async function handleChatMessage(message, channel) {
  try {
    const modResult = await galaxyGuard.moderateMessage(
      message.content,
      channel.id,
      message.userId
    );
    
    switch (modResult.action) {
      case 'ALLOW':
        // Message is safe, proceed normally
        break;
        
      case 'WARN':
        await warnUser(message.userId, channel.id);
        break;
        
      case 'MUTE':
        await timeoutUser(message.userId, channel.id, 24 * 60 * 60); // 24 hour timeout
        break;
        
      case 'TEMP_BAN':
        await banUser(message.userId, channel.id, 7 * 24 * 60 * 60); // 7 day ban
        break;
        
      case 'PERM_BAN':
        await banUser(message.userId, channel.id); // Permanent ban
        break;
    }
    
    // Store moderated message
    await galaxyGuard.storeMessage({
      ...message,
      moderationResult: modResult
    });
    
  } catch (error) {
    console.error('Moderation failed:', error);
    return handleModerationError(error, message);
  }
}

// Example of fetching channel messages
async function displayChannelHistory(channelId) {
  try {
    const messages = await galaxyGuard.getChannelMessages(channelId, {
      limit: 50,
      moderatedOnly: true
    });
    
    return messages;
  } catch (error) {
    console.error('Failed to fetch channel history:', error);
    throw error;
  }
}
```

## Error Handling

```javascript
function handleModerationError(error, message) {
  console.error('Moderation error:', error);
  
  // Log the error for investigation
  logError({
    type: 'moderation_error',
    error: error.message,
    messageId: message.id,
    timestamp: new Date()
  });
  
  // Implement fallback behavior
  // For example: Allow message through but flag for manual review
  return {
    action: 'REVIEW',
    error: true
  };
}
```

## Best Practices

1. Use the singleton instances of `tokenManager` and `galaxyGuard` throughout your application
2. The token manager automatically handles token caching and renewal
3. All API calls are centralized in the GalaxyGuardClient class
4. Implement proper error handling and fallbacks
5. Store moderation results with messages for future reference
6. Use appropriate timeouts and ban durations based on severity
7. Monitor moderation accuracy and adjust channel types as needed
8. Regularly review moderation logs to identify patterns and improve settings

## Implementation Notes

1. The token manager includes a 5-minute buffer before token expiry to ensure tokens are refreshed before they actually expire
2. All API calls are automatically authenticated using the cached token
3. The client handles common API interaction patterns and provides a clean interface
4. Error handling is consistent across all API calls
5. The implementation is modular and maintainable
