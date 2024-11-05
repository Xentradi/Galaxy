import axios from 'axios';
import {TokenManager} from './tokenManager';

export class GalaxyGuardClient {
  constructor(config) {
    this.tokenManager = new TokenManager(config);
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Token refresh interceptor
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getAccessToken();
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    });
  }

  async moderateMessage(message, channel) {
    const response = await this.axiosInstance.post(`/chat-moderation`, {
      content: message.content,
      channeType: 'twitch',
      channelId: channel.id,
      userId: message.userId,
      username: message.username
    });
    return response.data;
  }
}