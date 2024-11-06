# Installation Guide

This guide provides step-by-step instructions for setting up the Galaxy Moderation API.

## Prerequisites

- Node.js (Latest LTS version recommended)
- MongoDB installed and running
- OpenAI API key
- Git (for cloning the repository)

## Installation Steps

1. **Clone the Repository**
```bash
git clone <repository-url>
cd GalaxyGuard
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory using `.env-sample` as a template:

```env
PORT=3000
API_KEY=your_api_key_here
OPENAI_KEY=your_openai_api_key_here
DATABASE_URI=your_mongodb_uri_here
SESSION_SECRET=your_session_secret_here
NODE_ENV=development
```

Required environment variables:
- `PORT`: The port number for the server (default: 3000)
- `API_KEY`: Your custom API key for authentication
- `OPENAI_KEY`: Your OpenAI API key for moderation services
- `DATABASE_URI`: MongoDB connection string
- `SESSION_SECRET`: Secret for session management
- `NODE_ENV`: Application environment (development/production)

4. **Database Setup**
- Ensure MongoDB is running on your system
- The application will automatically create necessary collections on startup

5. **Start the Server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Verification

1. **Check Server Status**
- Open your browser or use curl to verify the server is running:
```bash
curl http://localhost:3000/auth/status
```

2. **Test Moderation API**
- Make a test request to the moderation endpoint:
```bash
curl -X POST http://localhost:3000/api/moderate \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -H "x-user-id: test_user" \
  -d '{"content": "test message"}'
```

## Troubleshooting

Common issues and solutions:

1. **MongoDB Connection Issues**
- Verify MongoDB is running: `mongosh`
- Check DATABASE_URI in .env
- Ensure network connectivity to MongoDB server

2. **OpenAI API Issues**
- Verify OPENAI_KEY is valid
- Check OpenAI service status
- Review API response in server logs

3. **Port Conflicts**
- Change PORT in .env if 3000 is in use
- Check for other services using the same port

## Next Steps

After successful installation:
1. Review the [Configuration Guide](Configuration-Guide) for system customization
2. Check the [Security Guide](Security-Guide) for securing your deployment
3. Explore the [API Documentation](API-Documentation) for available endpoints
