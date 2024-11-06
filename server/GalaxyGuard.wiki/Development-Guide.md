# Development Guide

## Getting Started

### Development Environment Setup

1. **Prerequisites**
   - Node.js (Latest LTS version)
   - MongoDB
   - Git
   - Your favorite code editor (VSCode recommended)

2. **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd GalaxyGuard

# Install dependencies
npm install

# Set up environment
cp .env-sample .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Code Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Business logic
├── middleware/     # Request processors
├── models/         # Data models
├── repositories/   # Data access
├── routes/         # API routes
└── services/       # External services
```

## Coding Standards

### JavaScript/Node.js

1. **Style Guide**
   - Use ES6+ features
   - Follow Airbnb JavaScript Style Guide
   - Use async/await for asynchronous operations
   - Implement proper error handling

2. **Example Code Style**
```javascript
// Good
async function getUserHistory(userId) {
  try {
    const history = await UserHistory.find({ userId });
    return history;
  } catch (error) {
    logger.error('Failed to fetch user history:', error);
    throw new Error('Database operation failed');
  }
}

// Bad
function getUserHistory(userId) {
  return UserHistory.find({ userId })
    .then(history => history)
    .catch(error => {
      console.log(error);
      throw error;
    });
}
```

### Code Documentation

1. **JSDoc Comments**
```javascript
/**
 * Determines moderation action based on content analysis
 * @param {Object} analysis - Content analysis results
 * @param {Object} context - Moderation context
 * @param {Object} userHistory - User's moderation history
 * @returns {Promise<string>} Determined moderation action
 * @throws {Error} If analysis is invalid
 */
async function determineAction(analysis, context, userHistory) {
  // Implementation
}
```

2. **Inline Comments**
- Use for complex logic explanation
- Avoid obvious comments
- Keep comments up to date

## Testing

### Unit Tests

```javascript
// Example test using Jest
describe('ContentModerator', () => {
  describe('determineAction', () => {
    it('should escalate action for repeat offenders', async () => {
      const moderator = new ContentModerator();
      const analysis = {
        highestSeverity: 0.6,
        flaggedCategory: 'harassment'
      };
      const context = { channelType: 'normal' };
      const userHistory = {
        recentInfractions: { warns: 3 }
      };

      const action = await moderator.determineAction(
        analysis,
        context,
        userHistory
      );

      expect(action).toBe(ModAction.MUTE);
    });
  });
});
```

### Integration Tests

```javascript
describe('Moderation API', () => {
  it('should moderate content successfully', async () => {
    const response = await request(app)
      .post('/api/moderate')
      .set('x-api-key', testApiKey)
      .set('x-user-id', 'test-user')
      .send({
        content: 'test content',
        channelId: 'test-channel'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('action');
  });
});
```

## Error Handling

### Best Practices

1. **Custom Error Classes**
```javascript
class ModrationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ModrationError';
    this.code = code;
  }
}
```

2. **Error Response Format**
```javascript
{
  message: 'Human-readable error message',
  error: 'Error identifier',
  details: {} // Additional error context
}
```

## Git Workflow

### Branching Strategy

1. **Branch Names**
   - feature/description
   - bugfix/description
   - hotfix/description
   - release/version

2. **Commit Messages**
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### Pull Request Process

1. **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Description of testing performed

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] All tests passing
```

## Performance Guidelines

### Database Operations

1. **Query Optimization**
```javascript
// Good
const user = await User.findOne({ id }).select('name email');

// Bad
const user = await User.findOne({ id });
```

2. **Indexing**
```javascript
// Create compound index
db.collection.createIndex({ field1: 1, field2: -1 });
```

### API Performance

1. **Response Time**
   - Target < 100ms for API responses
   - Use caching where appropriate
   - Implement pagination

2. **Memory Management**
   - Monitor memory usage
   - Implement garbage collection
   - Use streams for large data

## Debugging

### Tools and Techniques

1. **Logging**
```javascript
const logger = require('./logger');

logger.debug('Debug message', { context: 'additional info' });
logger.info('Info message');
logger.error('Error message', error);
```

2. **Debug Configuration**
```javascript
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/index.js"
    }
  ]
}
```

## Deployment

### Process

1. **Pre-deployment Checklist**
   - Run all tests
   - Update documentation
   - Check dependencies
   - Review security

2. **Deployment Steps**
   - Tag release
   - Build assets
   - Run migrations
   - Deploy code
   - Verify deployment

## Contributing

### Process

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Guidelines

1. Follow the code style guide
2. Add/update tests as needed
3. Update documentation
4. Keep PRs focused and atomic
