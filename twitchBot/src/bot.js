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

    // First try to get an existing valid token
    token = await tokenManager.getValidToken();

    // If no valid token and we have an auth code, try to exchange it
    if (!token && process.env.TWITCH_AUTH_CODE) {
      console.log('No valid token found, attempting to exchange auth code...');
      token = await tokenManager.exchangeCode(process.env.TWITCH_AUTH_CODE);
    }

    if (!token) {
      return; // The token manager will have prompted for authentication
    }

    console.log('Token obtained successfully, connecting to Twitch...');

    const opts = {
      identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: token
      },
      channels: config.twitch.Channels,
      options: {
        debug: true
      }
    }

    const client = new tmi.client(opts);

    client.on('message', onMessageHandler);
    client.on('connected', onConnectedHandler);
    client.on('disconnected', (reason) => {
      console.error('Bot disconnected:', reason);
      process.exit(1);
    });

    await client.connect().catch(err => {
      console.error('Connection error:', err.message);
      throw err;
    });
  } catch (error) {
    console.error('Failed to initialize bot:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    process.exit(1);
  }
}

function onConnectedHandler(addr, port) {
  console.log(`Connected to ${addr}:${port}`);
}

initializeBot();
