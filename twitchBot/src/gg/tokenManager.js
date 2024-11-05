import axios from 'axios';

export class TokenManager {
  constructor(config) {
    this.config = config;
    this.token = null;
    this.expiresAt = null;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL
    })
  }

  async getAccessToken() {
    if (!this.token || this.expiresAt <= Date.now()) {
      await this.refreshAccessToken();
    }
    return this.token;
  }

  async refreshAccessToken() {
    const response = await this.axiosInstance.post('/auth/oauth/token', {
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    });
    const {access_token, expires_in} = response.data;
    this.token = access_token;
    this.expiresAt = Date.now() + (expires_in * 1000); // Convert seconds to milliseconds
  }
}