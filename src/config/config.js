export default {
  oauth: {
    tokenExpiration: 3600,
    refreshTokenExpiration: 2592000,
    allowedScopes: [
      "read",
      "write",
      "admin"
    ]
  },
  moderation: {
    thresholds: {
      hate: {
        low: 0.4,
        medium: 0.7,
        high: 0.85
      },
      harassment: {
        low: 0.4,
        medium: 0.7,
        high: 0.85
      },
      sexual: {
        low: 0.5,
        medium: 0.75,
        high: 0.9
      },
      violence: {
        low: 0.5,
        medium: 0.75,
        high: 0.9
      },
      "self-harm": {
        low: 0.3,
        medium: 0.6,
        high: 0.8
      },
      spam: {
        low: 0.6,
        medium: 0.8,
        high: 0.9
      }
    },
    strikes: {
      warn: {
        limit: 3,
        decay: "7d"
      },
      mute: {
        limit: 2,
        decay: "30d"
      },
      tempBan: {
        limit: 2,
        decay: "90d"
      }
    },
    durations: {
      mute: 24,
      tempBan: 168
    },
    contextModifiers: {
      sensitiveChannel: 0.2,
      repeatOffense: 0.3,
      newUser: 0.1,
      trustedUser: -0.2,
      highActivityPeriod: 0.15
    }
  }
};
