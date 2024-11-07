import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class TokenManager {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    // Use environment variable for redirect URI or fall back to default with HTTPS
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
      return await this.refreshToken(tokenData.refresh_token);
    }

    return `oauth:${tokenData.access_token}`;
  }

  isTokenExpired(tokenData) {
    return Date.now() >= tokenData.expires_at;
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
      await this.initiateAuth();
      return null;
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
      return `oauth:${tokenData.access_token}`;
    } catch (error) {
      console.error('Failed to exchange code for token:', error.message);
      throw error;
    }
  }
}
