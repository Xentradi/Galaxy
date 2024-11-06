# Configuration Guide

## Environment Configuration

The system uses environment variables for configuration. Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
API_KEY=your_api_key_here
SESSION_SECRET=your_session_secret_here

# External Services
OPENAI_KEY=your_openai_api_key_here

# Database
DATABASE_URI=mongodb://localhost:27017/galaxyguard
```

## Moderation Configuration

Located in `src/config/config.js`, the moderation settings control the behavior of the content moderation system.

### Severity Thresholds

```javascript
thresholds: {
  hate: {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  },
  harassment: {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  },
  'self-harm': {
    low: 0.2,
    medium: 0.5,
    high: 0.7
  },
  sexual: {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  },
  violence: {
    low: 0.3,
    medium: 0.6,
    high: 0.8
  }
}
```

### Context Modifiers

```javascript
contextModifiers: {
  sensitiveChannel: 0.2,    // Increase severity in sensitive channels
  trustedUser: 0.1,         // Decrease severity for trusted users
  newUser: 0.2              // Increase severity for new users
}
```

### Strike System

```javascript
strikes: {
  warn: {
    limit: 3,              // Warnings before escalation
    duration: '30d'        // Strike duration
  },
  mute: {
    limit: 2,              // Mutes before escalation
    duration: '7d'         // Mute duration
  },
  tempBan: {
    limit: 2,              // Temp bans before permanent ban
    duration: '30d'        // Ban duration
  }
}
```

## Database Configuration

### Connection Options

```javascript
// src/config/db.js
const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  poolSize: 10,
  socketTimeoutMS: 45000,
  family: 4
};
```

### Indexes

Important indexes for performance:

```javascript
// User History Collection
db.userHistory.createIndex({ userId: 1, timestamp: -1 });
db.userHistory.createIndex({ userId: 1, action: 1 });

// Chat Messages Collection
db.chatMessages.createIndex({ channelId: 1, timestamp: -1 });
db.chatMessages.createIndex({ userId: 1, timestamp: -1 });
```

## Rate Limiting

Configure rate limits in `src/config/config.js`:

```javascript
rateLimits: {
  api: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // requests per window
  },
  moderation: {
    windowMs: 60 * 1000,       // 1 minute
    max: 30                     // moderation requests per window
  }
}
```

## Logging Configuration

### Log Levels

```javascript
logging: {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'json',
  timestamps: true
}
```

### Log Categories

```javascript
logCategories: {
  moderation: true,      // Log moderation decisions
  authentication: true,  // Log auth attempts
  errors: true,         // Log errors
  requests: false,      // Log all requests
  database: false       // Log database operations
}
```

## Channel Settings

Default channel configuration:

```javascript
channelDefaults: {
  sensitivityLevel: 'medium',
  autoModEnabled: true,
  customRules: [],
  whitelistedUsers: [],
  blacklistedTerms: []
}
```

## Cache Configuration

```javascript
cache: {
  userHistory: {
    ttl: 300,           // 5 minutes
    max: 1000          // Maximum entries
  },
  channelSettings: {
    ttl: 600,           // 10 minutes
    max: 100           // Maximum entries
  }
}
```

## OAuth Configuration

```javascript
oauth: {
  providers: {
    twitch: {
      enabled: true,
      scopes: ['user:read:email']
    },
    discord: {
      enabled: true,
      scopes: ['identify', 'email']
    }
  },
  sessionDuration: '24h'
}
```

## Custom Rules

Example of custom moderation rules:

```javascript
customRules: [
  {
    name: 'link_filter',
    pattern: /https?:\/\/[^\s]+/,
    action: 'REVIEW'
  },
  {
    name: 'caps_filter',
    test: (content) => {
      const upperCount = content.replace(/[^A-Z]/g, '').length;
      const totalCount = content.length;
      return upperCount / totalCount > 0.7;
    },
    action: 'WARN'
  }
]
```

## Performance Tuning

### Memory Limits

```javascript
performance: {
  maxRequestSize: '1mb',
  maxConcurrentRequests: 100,
  timeout: 5000
}
```

### Database Optimization

```javascript
database: {
  poolSize: 10,
  writeTimeout: 2500,
  readTimeout: 5000,
  maxQueryTime: 2000
}
```

## Development Tools

```javascript
development: {
  debug: true,
  stackTraces: true,
  mockOpenAI: false,
  testMode: false
}
```

## Monitoring Configuration

```javascript
monitoring: {
  metrics: {
    enabled: true,
    interval: 60000
  },
  alerts: {
    errorThreshold: 50,
    latencyThreshold: 2000
  }
}
```

## Configuration Best Practices

1. **Environment Variables**
   - Use `.env` for sensitive values
   - Keep different configs for dev/prod
   - Regular rotation of secrets

2. **Performance**
   - Monitor and adjust rate limits
   - Optimize database indexes
   - Configure appropriate cache TTLs

3. **Security**
   - Regular review of thresholds
   - Audit logging configuration
   - Update OAuth scopes as needed

4. **Maintenance**
   - Document all configuration changes
   - Test changes in development
   - Monitor impact of adjustments
