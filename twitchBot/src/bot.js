import 'dotenv/config'
import config from './config/config.js';
import tmi from 'tmi.js';
import axios from 'axios';
import {TwitchTokenManager} from './gg/twitchTokenManager.js';
import {onMessageHandler} from './handlers/messageHandler.js';

const tokenManager = new TwitchTokenManager({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET
});

async function initializeBot() {
  try {
    const token = await tokenManager.getAccessToken();

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
