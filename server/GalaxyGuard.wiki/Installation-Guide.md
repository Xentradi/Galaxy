# Installation Guide

This guide walks you through the process of installing and setting up GalaxyGuard.

## Prerequisites

1. **Node.js**
   - Version 14.x or higher
   - Download from [nodejs.org](https://nodejs.org/)

2. **MongoDB**
   - Version 4.x or higher
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)

3. **OpenAI API Key**
   - Required for content moderation
   - Get from [OpenAI Platform](https://platform.openai.com/)

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/GalaxyGuard.git
   cd GalaxyGuard/server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Copy the sample environment file
   cp .env-sample .env
   
   # Edit the .env file with your configuration
   nano .env
   ```

4. **Configure MongoDB**
   - Ensure MongoDB is running
   - Default connection string: `mongodb://localhost:27017/galaxy`
   - Create database and collections:
   ```bash
   mongosh
   use galaxy
   ```

5. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Client Setup (TwitchBot)

If you're using the included TwitchBot:

1. **Navigate to TwitchBot Directory**
   ```bash
   cd ../twitchBot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure TwitchBot**
   - Create client credentials using GalaxyGuard API
   - Configure the bot with obtained credentials

## Verification

1. **Check Server Status**
   ```bash
   # Server should be running on configured port (default: 3000)
   curl http://localhost:3000/health
   ```

2. **Create Client Credentials**
   ```bash
   # Using curl (replace with your values)
   curl -X POST http://localhost:3000/auth/clients \
     -H "Content-Type: application/json" \
     -d '{"name":"TestClient","scope":["read","write"]}'
   ```

3. **Test Authentication**
   ```bash
   # Get access token (replace credentials)
   curl -X POST http://localhost:3000/auth/oauth/token \
     -H "Authorization: Basic base64(clientId:clientSecret)" \
     -H "Content-Type: application/json" \
     -d '{"grant_type":"client_credentials"}'
   ```

## Common Issues

### MongoDB Connection
If MongoDB fails to connect:
1. Verify MongoDB is running
2. Check connection string in .env
3. Ensure network connectivity
4. Check MongoDB authentication if enabled

### OpenAI API
If moderation fails:
1. Verify OpenAI API key in .env
2. Check OpenAI service status
3. Ensure network connectivity
4. Verify API quota and limits

### Port Conflicts
If the server won't start due to port conflict:
1. Check if another service is using port 3000
2. Change PORT in .env file
3. Stop conflicting service

## Production Deployment

For production deployment:

1. **Environment**
   - Set NODE_ENV=production
   - Use secure JWT and session secrets
   - Configure proper MongoDB authentication
   - Set up proper logging

2. **Security**
   - Enable HTTPS
   - Set up proper firewalls
   - Configure rate limiting
   - Implement monitoring

3. **Process Management**
   - Use PM2 or similar process manager
   ```bash
   npm install -g pm2
   pm2 start src/index.js
   ```

4. **Monitoring**
   - Set up application monitoring
   - Configure error tracking
   - Implement logging solution

## Updating

To update GalaxyGuard:

1. **Backup**
   ```bash
   # Backup database
   mongodump -d galaxy
   
   # Backup configuration
   cp .env .env.backup
   ```

2. **Update Code**
   ```bash
   git pull
   npm install
   ```

3. **Migrate Data**
   - Check for migration scripts
   - Run necessary migrations
   - Verify data integrity

4. **Restart Services**
   ```bash
   # Development
   npm run dev
   
   # Production (with PM2)
   pm2 restart all
   ```

## Next Steps

1. Review the [Configuration Guide](Configuration-Guide)
2. Set up your client using the [API Documentation](API-Documentation)
3. Understand the system with [Architecture Overview](Architecture-Overview)
