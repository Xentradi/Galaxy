import { TwitchAuth, TwitchAPI } from '../src';

async function main(): Promise<void> {
  // Initialize the auth client
  const auth = new TwitchAuth({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'http://localhost:3000/callback'
  });

  // Initialize the API client
  const api = new TwitchAPI(auth);

  try {
    // Example 1: Get information about a user
    const users = await api.getUsers({ login: ['ninja'] });
    console.log('User Info:', users.data[0]);

    // Example 2: Get live streams
    const streams = await api.getStreams({
      user_login: ['ninja'],
      type: 'live'
    });
    console.log('Stream Info:', streams.data[0]);

    // Example 3: Get chat settings
    if (users.data[0]) {
      const chatSettings = await api.getChatSettings(users.data[0].id);
      console.log('Chat Settings:', chatSettings.data);
    }

    // Example 4: User Authentication Flow
    const authUrl = auth.getAuthorizationUrl([
      'channel:read:subscriptions',
      'channel:manage:broadcast'
    ]);
    console.log('Visit this URL to authenticate:', authUrl);

    // After user visits the URL and you receive the code, you can get the user access token
    // const code = '...'; // Get this from your callback endpoint
    // const userToken = await auth.getUserAccessToken(code);
    // console.log('User Access Token:', userToken);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Only run if this file is being run directly
if (require.main === module) {
  main().catch(console.error);
}

/*
To run this example:
1. Replace 'your-client-id' and 'your-client-secret' with your Twitch application credentials
2. Run `npx ts-node examples/basic-usage.ts`

Note: You'll need to register your application on the Twitch Developer Console:
https://dev.twitch.tv/console/apps

Make sure to:
1. Register a new application
2. Get the client ID and client secret
3. Set up a redirect URI (e.g., http://localhost:3000/callback)
4. Request appropriate scopes when getting user authorization
*/
