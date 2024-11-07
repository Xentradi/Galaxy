# Architecture Overview

GalaxyGuard follows a modular architecture with clear separation of concerns. This document outlines the key components and their interactions.

## System Components

### 1. Authentication System
- Implements OAuth 2.0 with Client Credentials grant type
- Manages client applications and access tokens
- Located in:
  - `src/routes/auth.js`: Authentication routes
  - `src/services/authService.js`: Authentication business logic
  - `src/middleware/authMiddleware.js`: Authentication middleware
  - `src/models/OAuthClient.js`: OAuth client model

### 2. Message Management
- Handles chat message storage and retrieval
- Components:
  - `src/routes/chatMessage.js`: Message endpoints
  - `src/controllers/chatMessageController.js`: Message handling logic
  - `src/models/ChatMessage.js`: Message data model
  - `src/repositories/chatMessageRepository.js`: Data access layer

### 3. Moderation System
- Provides content moderation using OpenAI
- Components:
  - `src/routes/moderation.js`: Moderation endpoints
  - `src/controllers/moderationController.js`: Moderation logic
  - `src/services/openAIService.js`: OpenAI integration
  - `src/config/config.js`: Moderation thresholds and rules

### 4. User History Tracking
- Tracks user behavior and moderation history
- Components:
  - `src/models/UserHistory.js`: User history model
  - `src/controllers/userHistoryController.js`: History tracking logic
  - `src/repositories/userHistoryRepository.js`: History data access
  - `src/services/userHistoryService.js`: History management

## Data Flow

1. **Message Processing Flow**
   ```
   Client Request
   → Authentication Middleware
   → Message Controller
   → Message Repository
   → Database
   ```

2. **Moderation Flow**
   ```
   Client Request
   → Authentication Middleware
   → Moderation Controller
   → OpenAI Service
   → User History Update
   → Response with Moderation Result
   ```

3. **Authentication Flow**
   ```
   Client Credentials
   → OAuth Token Request
   → Auth Service
   → JWT Generation
   → Access Token Response
   ```

## Database Schema

### OAuth Clients
```javascript
{
  clientId: String,
  clientSecret: String,
  name: String,
  scope: [String],
  isActive: Boolean
}
```

### Chat Messages
```javascript
{
  content: String,
  channelId: String,
  channelType: String,
  userId: String,
  username: String,
  timestamp: Date,
  moderation: {
    status: String,
    action: String,
    reason: String,
    moderatorId: String,
    timestamp: Date
  }
}
```

### User History
```javascript
{
  userId: String,
  username: String,
  channelId: String,
  strikes: [{
    type: String,
    reason: String,
    timestamp: Date,
    expiresAt: Date
  }],
  moderationActions: [{
    action: String,
    reason: String,
    timestamp: Date,
    moderatorId: String
  }]
}
```

## Security Measures

1. **Authentication**
   - OAuth 2.0 implementation
   - JWT-based access tokens
   - Secure credential storage

2. **Request Validation**
   - Input validation middleware
   - Request rate limiting
   - Scope-based authorization

3. **Data Protection**
   - Encrypted sensitive data
   - Secure MongoDB configuration
   - Environment variable protection

## Integration Points

### 1. Client Integration
Clients can integrate through:
- REST API endpoints
- OAuth 2.0 authentication
- Provided client libraries (e.g., TwitchBot implementation)

### 2. OpenAI Integration
- Content moderation using OpenAI's moderation API
- Configurable moderation thresholds
- Automatic content analysis

### 3. Database Integration
- MongoDB for data persistence
- Configurable connection settings
- Optimized queries and indexes

## Performance Considerations

1. **Caching**
   - In-memory caching for frequent requests
   - Database query optimization
   - Connection pooling

2. **Scalability**
   - Stateless architecture
   - Horizontal scaling capability
   - Load balancing ready

3. **Monitoring**
   - Request logging
   - Error tracking
   - Performance metrics

## Development Guidelines

1. **Code Organization**
   - Clear separation of concerns
   - Modular architecture
   - Consistent file naming

2. **Error Handling**
   - Centralized error handling
   - Detailed error logging
   - Client-friendly error responses

3. **Testing**
   - Unit tests for core functionality
   - Integration tests for API endpoints
   - Automated testing pipeline
