# GalaxyGuard API

GalaxyGuard is a RESTful API built with TypeScript and Node.js. It leverages the OpenAI moderation endpoint and a weighted logic system to determine if a given message should be allowed, deleted, result in the sender being muted, or result in the user being banned. The API also implements scaling punishments based on the severity of the infraction.

## Setup

1. **Install Dependencies**: Run `npm install` in the `GalaxyGuard` directory to install all necessary packages.

2. **Environment Variables**: Create a `.env` file in the `GalaxyGuard` directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Build the Project**: Compile the TypeScript files by running `npm run build` in the `GalaxyGuard` directory.

4. **Run the Server**: Start the server by running `npm start` in the `GalaxyGuard` directory.

## Endpoints

### POST /moderate

- **Description**: Moderates a message to determine the appropriate action.
- **Request Body**: 
  ```json
  {
    "message": "Your message here"
  }
  ```
- **Response**:
  ```json
  {
    "action": "allow" // or "delete", "mute", "ban"
  }
  ```

## Testing

Run the test suite using `npm test` to ensure the API functions correctly.

## License

This project is licensed under the ISC License.
