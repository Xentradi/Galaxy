# Galaxy Moderation API

## Overview

The Galaxy Moderation API is designed to use OpenAI's moderation endpoint to suggest moderation actions for platforms such as Twitch or Discord. The API provides endpoints for message storage, content moderation, and chat moderation operations. The API is secured with API keys and adheres to SOLID principles.

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following structure:

```plaintext
# Environment Variables

PORT=3000
API_KEY=your_api_key_here
OPENAI_KEY=your_openai_api_key_here
DATABASE_URI=your_mongodb_uri_here
```

The application will first attempt to use these environment variables and will fall back to `config.json` if they are not set.

## Running the Server

To start the server, run:

```bash
node index.js
```

The server will run on port 3000 by default.

## API Endpoints

All endpoints require the following headers:
- `x-api-key`: Your API key for authentication
- `x-user-id`: The ID of the user making the request

### POST /api/messages

Store chat messages without moderation. Use this endpoint when you only need to capture message data.

#### Request Body
```json
{
  "content": "message text",
  "username": "user123",
  "userId": "12345",
  "channelName": "channel",
  "channelId": "67890"
}
```

#### Response
```json
{
  "message": "Message stored successfully",
  "data": {
    "_id": "message_id",
    "content": "message text",
    "username": "user123",
    "timestamp": "2023-12-20T12:00:00Z",
    ...
  }
}
```

### POST /api/moderate

Moderate content without storing it. Use this endpoint when you only need to check content.

#### Request Body
```json
{
  "content": "content to moderate",
  "channelType": "normal",
  "channelId": "67890"
}
```

#### Response
```json
{
  "message": "Content moderated successfully",
  "action": "ALLOW",
  "analysis": {
    "categories": {
      "hate": "none",
      "violence": "none",
      ...
    },
    "highestSeverity": 0.01,
    "flaggedCategory": null
  },
  "severity": 0.01
}
```

### POST /api/chat-moderation

Endpoint that both stores the chat message and performs moderation in one operation. Use this when you need to capture and moderate chat messages together.

#### Request Body
```json
{
  "content": "message text",
  "username": "user123",
  "userId": "12345",
  "channelName": "channel",
  "channelId": "67890",
  "channelType": "normal"
}
```

#### Response
```json
{
  "message": {
    "_id": "message_id",
    "content": "message text",
    "username": "user123",
    "timestamp": "2023-12-20T12:00:00Z",
    ...
  },
  "moderation": {
    "action": "ALLOW",
    "analysis": {
      "categories": {
        "hate": "none",
        "violence": "none",
        ...
      },
      "highestSeverity": 0.01,
      "flaggedCategory": null
    },
    "severity": 0.01
  }
}
```

### GET /api/channels/:channelId/messages

Retrieve messages for a specific channel.

#### Query Parameters
- `limit` (optional): Number of messages to return (default: 100)
- `skip` (optional): Number of messages to skip (default: 0)
- `startDate` (optional): Filter messages from this date
- `endDate` (optional): Filter messages until this date
- `moderatedOnly` (optional): If true, return only moderated messages

#### Response
```json
{
  "messages": [
    {
      "_id": "message_id",
      "content": "message text",
      "username": "user123",
      "timestamp": "2023-12-20T12:00:00Z",
      ...
    },
    ...
  ]
}
```

### GET /api/training-data

Retrieve messages for AI training purposes.

#### Query Parameters
- `limit` (optional): Number of messages to return (default: 1000)
- `skip` (optional): Number of messages to skip (default: 0)
- `moderatedOnly` (optional): If true, return only moderated messages
- `categories` (optional): Comma-separated list of categories to filter by
- `startDate` (optional): Filter messages from this date
- `endDate` (optional): Filter messages until this date

#### Response
```json
{
  "data": [
    {
      "_id": "message_id",
      "content": "message text",
      "moderationType": "ALLOW",
      "toxicityScore": 0.01,
      ...
    },
    ...
  ]
}
```

## Security

The API uses API key authentication. Ensure your requests include both the `x-api-key` and `x-user-id` headers.

## License

This project is licensed under the ISC License.
