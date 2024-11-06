import axios from 'axios';

export class TwitchTokenManager {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.token = null;
    this.expiresAt = null;
  }

  async getAccessToken() {
    if (!this.token || this.expiresAt <= Date.now()) {
      await this.refreshAccessToken();
    }
    return this.token;
  }

  async refreshAccessToken() {
    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        }
      });

      const {access_token, expires_in} = response.data;
      this.token = `oauth:${access_token}`; // Twitch requires 'oauth:' prefix
      this.expiresAt = Date.now() + (expires_in * 1000);

      return this.token;
    } catch (error) {
      console.error('Failed to refresh Twitch token:', error.message);
      throw error;
    }
  }
}
