import 'dotenv/config'

import galaxyGuardService from '../services/galaxyGuardService.js';

export function onMessageHandler(target, context, message, self) {
  if (self) return; // Ignore messages from the bot itself

  const commandName = message.trim();
  console.log(`Received message: ${context.username} says: ${commandName} `);
  return;
}
