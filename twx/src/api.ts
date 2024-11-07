import axios, {InternalAxiosRequestConfig} from 'axios';
import type {
  ApiResponse,
  UserData,
  StreamData,
  ChatSettings,
  WebhookSubscription
} from './types';
import {TwitchAuth} from './auth';
import {randomBytes} from 'crypto';

export class TwitchAPI {
  private auth: TwitchAuth;
  private readonly client: ReturnType<typeof axios.create>;

  constructor(auth: TwitchAuth) {
    this.auth = auth;
    this.client = axios.create({
      baseURL: 'https://api.twitch.tv/helix',
      headers: {
        'Client-ID': (auth as any)['config'].clientId
      }
    });

    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      const token = await this.auth.getAccessToken();
      config.headers.set('Authorization', `Bearer ${token}`);
      return config;
    });
  }

  // Users
  async getUsers(params: {id?: string[], login?: string[]}): Promise<ApiResponse<UserData[]>> {
    const queryParams = new URLSearchParams();

    if (params.id) {
      params.id.forEach(id => queryParams.append('id', id));
    }
    if (params.login) {
      params.login.forEach(login => queryParams.append('login', login));
    }

    const {data} = await this.client.get<ApiResponse<UserData[]>>(`/users?${queryParams.toString()}`);
    return data;
  }

  // Streams
  async getStreams(params: {
    user_id?: string[],
    user_login?: string[],
    game_id?: string[],
    type?: 'all' | 'live',
    language?: string[],
    first?: number,
    before?: string,
    after?: string
  }): Promise<ApiResponse<StreamData[]>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const {data} = await this.client.get<ApiResponse<StreamData[]>>(`/streams?${queryParams.toString()}`);
    return data;
  }

  // Chat Settings
  async getChatSettings(broadcasterId: string): Promise<ApiResponse<ChatSettings>> {
    const {data} = await this.client.get<ApiResponse<ChatSettings>>(`/chat/settings?broadcaster_id=${broadcasterId}`);
    return data;
  }

  async updateChatSettings(
    broadcasterId: string,
    moderatorId: string,
    settings: Partial<ChatSettings>
  ): Promise<ApiResponse<ChatSettings>> {
    const {data} = await this.client.patch<ApiResponse<ChatSettings>>(
      `/chat/settings?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
      settings
    );
    return data;
  }

  // EventSub
  async createEventSubSubscription(
    type: string,
    version: string,
    condition: Record<string, any>,
    callback: string
  ): Promise<ApiResponse<WebhookSubscription>> {
    const {data} = await this.client.post<ApiResponse<WebhookSubscription>>('/eventsub/subscriptions', {
      type,
      version,
      condition,
      transport: {
        method: 'webhook',
        callback,
        secret: this.generateSecret()
      }
    });
    return data;
  }

  async getEventSubSubscriptions(): Promise<ApiResponse<WebhookSubscription[]>> {
    const {data} = await this.client.get<ApiResponse<WebhookSubscription[]>>('/eventsub/subscriptions');
    return data;
  }

  async deleteEventSubSubscription(id: string): Promise<void> {
    await this.client.delete(`/eventsub/subscriptions?id=${id}`);
  }

  // Channel Points
  async createCustomReward(
    broadcasterId: string,
    data: {
      title: string,
      cost: number,
      prompt?: string,
      enabled?: boolean,
      background_color?: string,
      is_user_input_required?: boolean,
      is_max_per_stream_enabled?: boolean,
      max_per_stream?: number,
      is_max_per_user_per_stream_enabled?: boolean,
      max_per_user_per_stream?: number,
      is_global_cooldown_enabled?: boolean,
      global_cooldown_seconds?: number,
      should_redemptions_skip_request_queue?: boolean
    }
  ): Promise<ApiResponse<any>> {
    const {data: responseData} = await this.client.post<ApiResponse<any>>(
      `/channel_points/custom_rewards?broadcaster_id=${broadcasterId}`,
      data
    );
    return responseData;
  }

  // Clips
  async createClip(broadcasterId: string): Promise<ApiResponse<{id: string, edit_url: string}>> {
    const {data} = await this.client.post<ApiResponse<{id: string, edit_url: string}>>(
      '/clips',
      null,
      {params: {broadcaster_id: broadcasterId}}
    );
    return data;
  }

  // Moderation
  async getBannedUsers(
    broadcasterId: string,
    params?: {
      user_id?: string[],
      first?: number,
      before?: string,
      after?: string
    }
  ): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams(`broadcaster_id=${broadcasterId}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const {data} = await this.client.get<ApiResponse<any>>(`/moderation/banned?${queryParams.toString()}`);
    return data;
  }

  private generateSecret(): string {
    return randomBytes(16).toString('base64').slice(0, 32);
  }
}
