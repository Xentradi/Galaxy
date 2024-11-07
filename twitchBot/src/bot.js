import 'dotenv/config'
import config from './config/config.js';
import tmi from 'tmi.js';
import {TokenManager} from './twitchAuth/tokenManager.js';
import {onMessageHandler} from './handlers/messageHandler.js';

const tokenManager = new TokenManager({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET
});

async function initializeBot() {
  try {
    let token;

    // If we have an auth code, exchange it for a token
    if (process.env.TWITCH_AUTH_CODE) {
      token = await tokenManager.exchangeCode(process.env.TWITCH_AUTH_CODE);
    } else {
      token = await tokenManager.getValidToken();
    }

    if (!token) {
      return; // The token manager will have prompted for authentication
    }

    const opts = {
      identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: token
      },
      channels: config.twitch.Channels
    }

    const client = new tmi.client(opts);

    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);

    await client.connect();
  } catch (error) {
    console.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

function onConnectedHandler(addr, port) {
  console.log(`Connected to ${addr}:${port}`);
}

initializeBot();
