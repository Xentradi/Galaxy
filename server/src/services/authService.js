import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthService {
  constructor() {
    this.tokens = new Map(); // In-memory token store (consider using Redis in production)
  }

  generateClientCredentials() {
    const clientId = crypto.randomBytes(16).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');
    return {clientId, clientSecret};
  }

  async generateAccessToken(client) {
    const token = jwt.sign(
      {
        clientId: client.clientId,
        type: 'access_token',
        scope: client.scope
      },
      process.env.JWT_SECRET || 'your-secret-key',
      {expiresIn: '1h'}
    );

    this.tokens.set(token, {
      clientId: client.clientId,
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600
    };
  }

  async validateToken(token) {
    try {
      // Check if token exists in store
      const storedToken = this.tokens.get(token);
      if (!storedToken) {
        return false;
      }

      // Check if token has expired
      if (storedToken.expiresAt < Date.now()) {
        this.tokens.delete(token);
        return false;
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      return decoded;
    } catch (error) {
      return false;
    }
  }

  async revokeToken(token) {
    this.tokens.delete(token);
  }
}

export default new AuthService();
