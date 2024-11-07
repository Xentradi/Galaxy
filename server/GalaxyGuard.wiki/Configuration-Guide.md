# Configuration Guide

This guide explains how to configure the GalaxyGuard server for your environment.

## Environment Variables

Create a `.env` file in the server root directory using the `.env-sample` as a template:

```env
# Server Configuration
PORT=3000                           # Port number for the server to listen on
NODE_ENV=development               # Environment mode: development or production

# Security
JWT_SECRET=your_jwt_secret_here    # Secret key for JWT token generation/validation
SESSION_SECRET=your_session_secret  # Secret key for session management

# Database
DATABASE_URI=mongodb://localhost:27017/galaxy    # MongoDB connection string

# OpenAI Configuration
OPENAI_KEY=your_openai_api_key_here             # OpenAI API key for moderation services
```

## Moderation Configuration

The moderation system is configured in `src/config/config.js` with the following settings:

### Content Moderation Thresholds
Defines sensitivity levels for different types of content:
```javascript
thresholds: {
  hate: { low: 0.4, medium: 0.7, high: 0.85 },
  harassment: { low: 0.4, medium: 0.7, high: 0.85 },
  sexual: { low: 0.5, medium: 0.75, high: 0.9 },
  violence: { low: 0.5, medium: 0.75, high: 0.9 },
  "self-harm": { low: 0.3, medium: 0.6, high: 0.8 },
  spam: { low: 0.6, medium: 0.8, high: 0.9 }
}
```

### Strike System
Configures the punishment system:
```javascript
strikes: {
  warn: { limit: 3, decay: "7d" },
  mute: { limit: 2, decay: "30d" },
  tempBan: { limit: 2, decay: "90d" }
}
```

### Punishment Durations
Sets the duration (in hours) for different punishments:
```javascript
durations: {
  mute: 24,    // 24 hours
  tempBan: 168  // 1 week
}
```

### Context Modifiers
Adjusts moderation sensitivity based on context:
```javascript
contextModifiers: {
  sensitiveChannel: 0.2,
  repeatOffense: 0.3,
  newUser: 0.1,
  trustedUser: -0.2,
  highActivityPeriod: 0.15
}
```

## OAuth Configuration

OAuth settings are configured in `src/config/config.js`:

```javascript
oauth: {
  tokenExpiration: 3600,            // Access token expiration in seconds (1 hour)
  refreshTokenExpiration: 2592000,  // Refresh token expiration in seconds (30 days)
  allowedScopes: ["read", "write", "admin"]
}
```

## Database Configuration

The MongoDB connection is configured through the `DATABASE_URI` environment variable. The default configuration expects MongoDB to be running locally on the default port (27017) with a database named "galaxy".

## Security Considerations

1. Never commit the `.env` file to version control
2. Use strong, unique values for JWT_SECRET and SESSION_SECRET
3. Keep your OpenAI API key secure and never expose it publicly
4. In production, ensure MongoDB is properly secured with authentication
