import 'dotenv/config'
var config = {}

config.twitch = {
  "BotUserName": process.env.TWITCH_BOT_USERNAME || "your_twitch_username",
  "BotOAuthToken": process.env.TWITCH_BOT_ACCESS_TOKEN || "your_twitch_oauth_token",
  "Channels": [
    "BrolyInu",
    "Momichu",
    "Spactana",
    "Xentradi"
  ]
}

export default config;