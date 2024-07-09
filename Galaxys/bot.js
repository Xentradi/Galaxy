import 'dotenv/config'

import config from './config.js';
import tmi from 'tmi.js';
import axios from 'axios';


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

function onMessageHandler(target, context, message, self) {
  if (self) return; // Ignore messages from the bot itself

  const commandName = message.trim();
  console.log(`Received message: ${context.username} says: ${commandName} `);
  return;

}

function onConnectedHandler(addr, port) {
  console.log(`Connected to ${addr}:${port}`);
}