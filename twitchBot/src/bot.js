import 'dotenv/config'

import config from './config/config.js';
import tmi from 'tmi.js';
import axios from 'axios';

import {onMessageHandler} from './handlers/messageHandler.js';

const opts = {
  identity: {
    username: config.twitch.BotUserName,
    password: config.twitch.BotOAuthToken,
  },
  channels: config.twitch.Channels
}

const client = new tmi.client(opts);

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

client.connect();

function onConnectedHandler(addr, port) {
  console.log(`Connected to ${addr}:${port}`);
}
