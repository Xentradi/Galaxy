import axios from 'axios';
import { TwitchAuth } from '../auth';
import { TwitchAuthConfig } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TwitchAuth', () => {
  let auth: TwitchAuth;
  const mockConfig: TwitchAuthConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback'
  };

  beforeEach(() => {
    auth = new TwitchAuth(mockConfig);
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should fetch a new access token when none exists', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 3600,
          token_type: 'bearer'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const token = await auth.getAccessToken();

      expect(token).toBe('new-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: mockConfig.clientId,
            client_secret: mockConfig.clientSecret,
            grant_type: 'client_credentials'
          }
        }
      );
    });

    it('should reuse existing token if still valid', async () => {
      // First call to get token
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600,
          token_type: 'bearer'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // Get token first time
      const token1 = await auth.getAccessToken();
      
      // Clear mock to verify it's not called again
      mockedAxios.post.mockClear();
      
      // Get token second time
      const token2 = await auth.getAccessToken();

      expect(token1).toBe('test-access-token');
      expect(token2).toBe('test-access-token');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('getUserAccessToken', () => {
    it('should exchange authorization code for access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'user-access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          scope: ['channel:read:subscriptions'],
          token_type: 'bearer'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await auth.getUserAccessToken('test-auth-code');

      expect(result.accessToken).toBe('user-access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: mockConfig.clientId,
            client_secret: mockConfig.clientSecret,
            code: 'test-auth-code',
            grant_type: 'authorization_code',
            redirect_uri: mockConfig.redirectUri
          }
        }
      );
    });

    it('should throw error if redirectUri is not provided', async () => {
      const authWithoutRedirect = new TwitchAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });

      await expect(authWithoutRedirect.getUserAccessToken('test-code'))
        .rejects
        .toThrow('Redirect URI is required for user authentication');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const scopes = ['channel:read:subscriptions', 'channel:manage:broadcast'];
      const url = auth.getAuthorizationUrl(scopes);

      const expectedUrl = 'https://id.twitch.tv/oauth2/authorize?' + new URLSearchParams({
        client_id: mockConfig.clientId,
        redirect_uri: mockConfig.redirectUri!,
        response_type: 'code',
        scope: scopes.join(' ')
      }).toString();

      expect(url).toBe(expectedUrl);
    });

    it('should throw error if redirectUri is not provided', () => {
      const authWithoutRedirect = new TwitchAuth({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      });

      expect(() => authWithoutRedirect.getAuthorizationUrl(['test:scope']))
        .toThrow('Redirect URI is required for authorization URL');
    });
  });
});
