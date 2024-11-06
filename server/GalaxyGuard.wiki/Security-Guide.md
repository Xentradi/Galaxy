# Security Guide

## Authentication

### API Key Authentication
- Required header: `x-api-key`
- Keys should be at least 32 characters long
- Store keys securely using environment variables
- Rotate keys periodically
- Never expose keys in client-side code or version control

### User Identification
- Required header: `x-user-id`
- Used for tracking moderation history
- Must be consistent across requests for the same user
- Should be a unique identifier from your platform

### OAuth Integration
- Supports standard OAuth 2.0 flow
- Secure session management
- Configurable session expiration
- HTTPS required in production

## Environment Security

### Production Configuration
```env
NODE_ENV=production
SESSION_SECRET=<strong-random-value>
API_KEY=<your-api-key>
OPENAI_KEY=<your-openai-key>
DATABASE_URI=mongodb+srv://user:pass@host/db
```

Required security settings:
- `NODE_ENV`: Set to 'production'
- `SESSION_SECRET`: Strong random value
- HTTPS enabled
- Secure cookie settings
- Rate limiting configured
- Request size limits set

### Development Security
- Use separate API keys for development
- Never use production credentials in development
- Maintain separate databases for development/production
- Use environment-specific configuration files

## Data Security

### Database Security
1. **Connection**
   - Use SSL/TLS for database connections
   - Implement connection pooling
   - Set appropriate timeouts
   - Use least-privilege database users

2. **Data Storage**
   - Hash sensitive data
   - Encrypt at rest
   - Regular backups
   - Data retention policies

3. **Access Control**
   - Role-based access
   - IP whitelisting
   - Regular access audits

### Content Security
1. **Input Validation**
   - Sanitize all user input
   - Validate request parameters
   - Enforce content size limits
   - Check content types

2. **Output Encoding**
   - Encode HTML entities
   - Sanitize JSON output
   - Prevent XSS attacks
   - Set proper content headers

## API Security

### Rate Limiting
```javascript
// Example rate limit configuration
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
}
```

### Request Validation
- Validate request body
- Check content length
- Verify content type
- Validate parameters

### Error Handling
- Don't expose internal errors
- Log securely
- Return appropriate status codes
- Maintain audit trail

## Best Practices

### General Security
1. Keep dependencies updated
2. Regular security audits
3. Implement logging and monitoring
4. Use security headers
5. Enable CORS appropriately
6. Regular penetration testing

### Code Security
1. **Secure Coding**
   - Input validation
   - Output encoding
   - Error handling
   - Secure defaults

2. **Dependencies**
   - Regular updates
   - Security audits
   - Lock file maintenance
   - Vulnerability scanning

### Deployment Security
1. **Server Hardening**
   - Updated OS/packages
   - Firewall configuration
   - Service hardening
   - Regular updates

2. **Network Security**
   - HTTPS only
   - Proper SSL/TLS configuration
   - IP filtering
   - DDoS protection

## Security Headers

```javascript
// Recommended security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'same-origin' }
}));
```

## Incident Response

### Security Incidents
1. Identify and isolate
2. Assess impact
3. Contain breach
4. Investigate cause
5. Implement fixes
6. Document incident
7. Review and improve

### Recovery Steps
1. Reset compromised credentials
2. Update security measures
3. Patch vulnerabilities
4. Restore from backup if needed
5. Update documentation
6. Notify affected parties
7. Review security policies

## Security Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error handling secured
- [ ] Dependencies updated
- [ ] Security tests passed
- [ ] SSL/TLS configured
- [ ] Logging implemented
- [ ] Monitoring setup

### Regular Maintenance
- [ ] Update dependencies
- [ ] Review logs
- [ ] Audit access
- [ ] Test backups
- [ ] Review configurations
- [ ] Update documentation
- [ ] Security training
- [ ] Penetration testing
