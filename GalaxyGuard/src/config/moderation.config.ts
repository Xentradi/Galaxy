export interface ModerationConfig {
  openai: {
    apiKey?: string;
    moderationUrl: string;
  };
  defaultThresholds: {
    individual: {
      ban: number;
      mute: number;
      delete: number;
      warn: number;
    };
    cumulative: {
      ban: number;
      mute: number;
      delete: number;
      warn: number;
    };
  };
}

const config: ModerationConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    moderationUrl: 'https://api.openai.com/v1/moderations'
  },
  defaultThresholds: {
    individual: {
      ban: 0.9,
      mute: 0.7,
      delete: 0.5,
      warn: 0.3
    },
    cumulative: {
      ban: 0.7,
      mute: 0.5,
      delete: 0.3,
      warn: 0.2
    }
  }
};

export default config;
