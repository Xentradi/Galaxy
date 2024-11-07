import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class TokenManager {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = process.env.TWITCH_REDIRECT_URI || 'https://localhost:3001/callback';
    this.tokenFile = path.join(process.cwd(), '.twitch_token.json');
  }

  async loadToken() {
    try {
      const data = await fs.readFile(this.tokenFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveToken(tokenData) {
    await fs.writeFile(this.tokenFile, JSON.stringify(tokenData, null, 2));
  }

  async getValidToken() {
    const tokenData = await this.loadToken();

    if (!tokenData) {
      console.log('No token found. Please authenticate the bot first.');
      await this.initiateAuth();
      return null;
    }

    if (this.isTokenExpired(tokenData)) {
      try {
        return await this.refreshToken(tokenData.refresh_token);
      } catch (error) {
        console.error('Token refresh failed:', error.message);
        await this.initiateAuth();
        return null;
      }
    }

    return `oauth:${tokenData.access_token}`;
  }

  isTokenExpired(tokenData) {
    // Add a 5-minute buffer to expiration time
    return Date.now() >= (tokenData.expires_at - 300000);
  }

  async refreshToken(refreshToken) {
    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }
      });

      const tokenData = {
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      await this.saveToken(tokenData);
      return `oauth:${tokenData.access_token}`;
    } catch (error) {
      console.error('Failed to refresh token:', error.message);
      throw error;
    }
  }

  async initiateAuth() {
    const scopes = ['chat:read', 'chat:edit'];

    const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${this.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}`;

    console.log('\nPlease authenticate the bot by visiting:');
    console.log(authUrl);
    console.log('\nIMPORTANT: Make sure this redirect URI is registered in your Twitch Developer Console:');
    console.log(this.redirectUri);
    console.log('\nAfter authorization, you will be redirected to the callback URL.');
    console.log('Please copy the "code" parameter from the URL and set it in your .env file as TWITCH_AUTH_CODE');
    console.log('\nNOTE: The auth code is one-time use only. After successful token exchange, it will be removed from .env');
    console.log('      and the bot will use refresh tokens for future authentication.\n');
    process.exit(1);
  }

  async exchangeCode(code) {
    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }
      });

      const tokenData = {
        ...response.data,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      await this.saveToken(tokenData);

      // After successful token exchange, remove the auth code from .env
      try {
        const envPath = path.join(process.cwd(), '.env');
        const content = await fs.readFile(envPath, 'utf8');
        const newContent = content.replace(/^TWITCH_AUTH_CODE=.*$/m, '');
        await fs.writeFile(envPath, newContent);
      } catch (error) {
        console.warn('Warning: Could not remove TWITCH_AUTH_CODE from .env file');
      }

      return `oauth:${tokenData.access_token}`;
    } catch (error) {
      if (error.response?.status === 400) {
        console.error('\nError: The authorization code has already been used or is invalid.');
        console.error('This is normal if you\'re restarting the bot - it will now use the saved refresh token.\n');
        return await this.getValidToken();
      }
      throw error;
    }
  }
}
