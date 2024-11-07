export interface TwitchAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

export interface AccessToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  obtainmentTimestamp: number;
  scope?: string[];
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    cursor?: string;
  };
}

export interface UserData {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface StreamData {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  tags: string[];
  is_mature: boolean;
}

export interface ChatSettings {
  broadcaster_id: string;
  slow_mode: boolean;
  slow_mode_wait_time?: number;
  follower_mode: boolean;
  follower_mode_duration?: number;
  subscriber_mode: boolean;
  emote_mode: boolean;
  unique_chat_mode: boolean;
  non_moderator_chat_delay: boolean;
  non_moderator_chat_delay_duration?: number;
}

export interface WebhookSubscription {
  id: string;
  type: string;
  version: string;
  status: string;
  cost: number;
  condition: Record<string, any>;
  transport: {
    method: string;
    callback: string;
  };
  created_at: string;
}

export interface TwitchTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
}
