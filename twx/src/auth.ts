import axios from 'axios';
import type { TwitchAuthConfig, AccessToken, TwitchTokenResponse } from './types';

export class TwitchAuth {
  private config: TwitchAuthConfig;
  private currentToken: AccessToken | null = null;

  constructor(config: TwitchAuthConfig) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.currentToken!.accessToken;
    }

    await this.refreshAccessToken();
    return this.currentToken!.accessToken;
  }

  private isTokenValid(): boolean {
    if (!this.currentToken) return false;

    const expirationTime = this.currentToken.obtainmentTimestamp + 
      (this.currentToken.expiresIn * 1000);
    return Date.now() < expirationTime - 300000; // 5 minute buffer
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const { data } = await axios.post<TwitchTokenResponse>('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials'
        }
      });

      this.currentToken = {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        obtainmentTimestamp: Date.now(),
        scope: data.scope
      };
    } catch (error) {
      throw new Error('Failed to obtain Twitch access token');
    }
  }

  async getUserAccessToken(code: string): Promise<AccessToken> {
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI is required for user authentication');
    }

    try {
      const { data } = await axios.post<TwitchTokenResponse>('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        }
      });

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        obtainmentTimestamp: Date.now(),
        scope: data.scope
      };
    } catch (error) {
      throw new Error('Failed to obtain user access token');
    }
  }

  getAuthorizationUrl(scopes: string[]): string {
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI is required for authorization URL');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' ')
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await axios.get('https://id.twitch.tv/oauth2/validate', {
        headers: {
          'Authorization': `OAuth ${token}`
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async revokeToken(token: string): Promise<void> {
    try {
      await axios.post('https://id.twitch.tv/oauth2/revoke', null, {
        params: {
          client_id: this.config.clientId,
          token
        }
      });
    } catch (error) {
      throw new Error('Failed to revoke token');
    }
  }
}
