# Galaxy Moderation API

## Overview

The Galaxy Moderation API is designed to use OpenAI's moderation endpoint to suggest moderation actions for platforms such as Twitch or Discord. The API is secured with API keys and adheres to SOLID principles.

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

### POST /api/moderate

This endpoint accepts content for moderation and returns the moderation result.

#### Request

- **Headers**: 
  - `x-api-key`: Your API key for authentication.
- **Body**: JSON object containing the content to be moderated.
  ```json
  {
    "content": "The content to be moderated"
  }
  ```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/moderate \
-H "Content-Type: application/json" \
-H "x-api-key: your_api_key_here" \
-d '{"content": "This is a test content to be moderated."}'
```

#### Response

- **Success**: Returns a JSON object with the moderation result.
  ```json
  {
    "message": "Content moderated successfully",
    "moderationResult": { /* OpenAI moderation result */ }
  }
  ```

- **Error**: Returns a JSON object with an error message.
  ```json
  {
    "message": "Failed to moderate content",
    "error": "Error details"
  }
  ```

#### Example Response

```json
{
  "message": "Content moderated successfully",
  "moderationResult": {
    "flagged": false,
    "categories": {
      "hate": false,
      "violence": false,
      "self-harm": false
    },
    "category_scores": {
      "hate": 0.01,
      "violence": 0.02,
      "self-harm": 0.01
    }
  }
}
```

## Security

The API uses API key authentication. Ensure your requests include the correct `x-api-key` header.

## License

This project is licensed under the ISC License.
