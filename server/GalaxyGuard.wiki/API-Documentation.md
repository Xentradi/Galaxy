# API Documentation

## Authentication

All API endpoints require authentication using:
- `x-api-key` header: Your API key
- `x-user-id` header: User identifier

## Endpoints

### Content Moderation

#### POST /api/moderate
Moderates content using OpenAI's moderation endpoint.

**Request:**
```json
{
  "content": "string",
  "channelType": "normal|sensitive",
  "channelId": "string"
}
```

**Response:**
```json
{
  "message": "Content moderated successfully",
  "action": "ALLOW|REVIEW|WARN|MUTE|TEMP_BAN|PERM_BAN",
  "analysis": {
    "categories": {
      "hate": "none|low|medium|high",
      "harassment": "none|low|medium|high",
      "self-harm": "none|low|medium|high",
      "sexual": "none|low|medium|high",
      "violence": "none|low|medium|high"
    },
    "highestSeverity": 0.0,
    "flaggedCategory": "string"
  },
  "severity": 0.0
}
```

### Chat Messages

#### POST /api/chat/message
Stores a chat message with moderation results.

**Request:**
```json
{
  "content": "string",
  "channelId": "string",
  "messageId": "string"
}
```

**Response:**
```json
{
  "message": "Message stored successfully",
  "id": "string"
}
```

#### GET /api/chat/messages
Retrieves chat messages for a channel.

**Query Parameters:**
- `channelId` (required): Channel identifier
- `limit` (optional): Number of messages to return (default: 100)
- `before` (optional): Timestamp to get messages before
- `after` (optional): Timestamp to get messages after

**Response:**
```json
{
  "messages": [
    {
      "id": "string",
      "content": "string",
      "userId": "string",
      "channelId": "string",
      "timestamp": "string",
      "moderationResult": {
        "action": "string",
        "severity": 0.0,
        "categories": {}
      }
    }
  ]
}
```

### User History

#### GET /api/user/history
Retrieves moderation history for a user.

**Query Parameters:**
- `userId` (required): User identifier
- `limit` (optional): Number of records to return (default: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "history": [
    {
      "timestamp": "string",
      "action": "string",
      "reason": "string",
      "severity": 0.0,
      "expiresAt": "string"
    }
  ],
  "stats": {
    "totalInfractions": 0,
    "activeStrikes": 0,
    "trustScore": 0.0
  }
}
```

### Channel Moderation Settings

#### GET /api/moderation/settings
Retrieves moderation settings for a channel.

**Query Parameters:**
- `channelId` (required): Channel identifier

**Response:**
```json
{
  "settings": {
    "sensitivityLevel": "low|medium|high",
    "autoModEnabled": true,
    "customRules": [],
    "whitelistedUsers": [],
    "blacklistedTerms": []
  }
}
```

#### PUT /api/moderation/settings
Updates moderation settings for a channel.

**Request:**
```json
{
  "channelId": "string",
  "settings": {
    "sensitivityLevel": "low|medium|high",
    "autoModEnabled": true,
    "customRules": [],
    "whitelistedUsers": [],
    "blacklistedTerms": []
  }
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 500 Internal Server Error
```json
{
  "message": "An unexpected error occurred",
  "error": "Detailed error message (development mode only)"
}
