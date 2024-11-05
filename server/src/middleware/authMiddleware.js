import authService from '../services/authService.js';
import OAuthClient from '../models/OAuthClient.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({message: 'Access token is required'});
    }

    const decoded = await authService.validateToken(token);
    if (!decoded) {
      return res.status(403).json({message: 'Invalid or expired token'});
    }

    // Attach client info to request
    req.client = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({message: 'Authentication error'});
  }
};

export const validateClientCredentials = async (req, res, next) => {
  try {
    const {client_id, client_secret} = req.body;

    if (!client_id || !client_secret) {
      return res.status(400).json({message: 'Client credentials are required'});
    }

    const client = await OAuthClient.findOne({clientId: client_id});
    if (!client || !client.validateSecret(client_secret) || !client.isActive) {
      return res.status(401).json({message: 'Invalid client credentials'});
    }

    // Update last used timestamp
    await client.updateLastUsed();

    // Attach client to request for token generation
    req.oauthClient = client;
    next();
  } catch (error) {
    console.error('Client validation error:', error);
    res.status(500).json({message: 'Validation error'});
  }
};

// Optional: Middleware to check specific scopes
export const requireScope = (requiredScope) => {
  return (req, res, next) => {
    const clientScopes = req.client?.scope || [];
    if (!clientScopes.includes(requiredScope) && !clientScopes.includes('admin')) {
      return res.status(403).json({
        message: `Insufficient scope. Required: ${requiredScope}`
      });
    }
    next();
  };
};
