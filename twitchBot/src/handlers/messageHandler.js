import 'dotenv/config'
import {GalaxyGuard, Mode} from '../gg/index.js';

export function onMessageHandler(target, context, message, self) {
  if (self) return; // Ignore messages from the bot itself
  const guard = new GalaxyGuard({
    apiUrl: process.env.GALAXY_GUARD_API_URL,
    clientId: process.env.GALAXY_GUARD_CLIENT_ID,
    clientSecret: process.env.GALAXY_GUARD_CLIENT_SECRET,
    mode: Mode.LOG,
  });

  const commandName = message.trim();
  console.log(`Received message: ${context.username} says: ${commandName} `);
  return;
}
