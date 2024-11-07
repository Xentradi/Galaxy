import 'dotenv/config'
import {GalaxyGuard, Mode} from '../gg/index.js';

/**
 * @param {string} channel - The channel where the message was sent
 * @param {import('tmi.js').ChatUserstate} tags - The message tags containing user info
 * @param {string} message - The message content
 * @param {boolean} self - Whether the message was sent by the bot
 */
export async function onMessageHandler(channel, tags, message, self) {
  if (self) return; // Ignore messages from the bot itself
  const guard = new GalaxyGuard({
    apiUrl: process.env.GALAXY_GUARD_API_URL,
    clientId: process.env.GALAXY_GUARD_CLIENT_ID,
    clientSecret: process.env.GALAXY_GUARD_CLIENT_SECRET,
    mode: Mode.LOG,
  });

  message = message.toLowerCase().trim();
  console.log('Channel: ' + channel);
  console.log('Tags: ' + JSON.stringify(tags));
  console.log('Content: ' + message);
  console.log(`[${channel}] ${tags['display-name']}(${tags['username']}): ${message}`);
  return;
}
