# Galaxy Moderation API

A powerful content moderation system leveraging OpenAI's technology to provide intelligent content filtering and moderation suggestions for platforms like Twitch and Discord.

## ✨ Key Features

- Real-time content moderation using OpenAI's moderation endpoint
- Message storage and retrieval capabilities
- Flexible API endpoints for various moderation needs
- Channel-specific moderation settings
- Training data collection for AI improvement
- Secure authentication using API keys

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure your environment variables:
```env
PORT=3000
API_KEY=your_api_key_here
OPENAI_KEY=your_openai_api_key_here
DATABASE_URI=your_mongodb_uri_here
```

4. Start the server:
```bash
npm start
```

## 📚 Documentation

Comprehensive documentation is available in our [Wiki](Galaxy.wiki/Home):

- [Installation Guide](Galaxy.wiki/Installation-Guide) - Detailed setup instructions
- [Configuration Guide](Galaxy.wiki/Configuration-Guide) - Environment and system configuration
- [API Documentation](Galaxy.wiki/API-Documentation) - Complete API endpoints reference
- [Architecture Overview](Galaxy.wiki/Architecture-Overview) - System design and components
- [Security Guide](Galaxy.wiki/Security-Guide) - Security best practices and authentication
- [Development Guide](Galaxy.wiki/Development-Guide) - Contributing and development guidelines

## 🔒 Security

The API uses API key authentication. All requests require:
- `x-api-key` header: Your API key
- `x-user-id` header: User identifier

## 📦 System Requirements

- Node.js
- MongoDB database
- OpenAI API key
- Secure environment for API key storage

## 📄 License

This project is licensed under the ISC License.
