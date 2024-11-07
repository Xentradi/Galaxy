# Moderation System Enhancement TODO

## Set up the local LLM (DistilBERT)
- [ ] Install the necessary dependencies for running DistilBERT locally
- [ ] Create a new service file (e.g., src/services/localLLMService.js) to handle the interaction with DistilBERT
- [ ] Implement methods for loading the model, preprocessing the input, generating moderation scores, and performing the actual moderation task

## Modify the ChatMessage model
- [ ] Add a new field called "priorityScore" to store the priority score assigned by the local LLM
- [ ] Update the schema definition in src/models/ChatMessage.js

## Implement the priority queue
- [ ] Create a new file (e.g., src/utils/priorityQueue.js) to implement the priority queue data structure
- [ ] Define methods for enqueuing messages based on their priority score and dequeuing messages in priority order

## Update the moderation controller
- [ ] Modify the moderateContent function to first check the availability of the OpenAI service
- [ ] If OpenAI is available, proceed with the existing flow of sending the message to OpenAI for moderation
- [ ] If OpenAI is unavailable, use the local LLM service to perform the moderation task directly
- [ ] Update the chat message with the moderation results from either OpenAI or the local LLM
- [ ] Enqueue the message into the priority queue based on its priority score
- [ ] Process messages from the priority queue in a separate background job or a dedicated queue processor

## Adapt the chatMessageRepository
- [ ] Update the create method to include the priority score when saving a new chat message
- [ ] Modify the findByChannel and getTrainingData methods to support filtering and sorting based on the priority score if needed

## Configure the queue processor
- [ ] Create a new file (e.g., src/workers/queueProcessor.js) to process messages from the priority queue
- [ ] Dequeue messages in priority order and send them to OpenAI's moderation endpoint or use the local LLM for moderation, depending on OpenAI's availability
- [ ] Update the chat message with the moderation results and take appropriate actions based on the moderation outcome

## Add error handling and fallback logic
- [ ] Implement error handling in the OpenAIService to detect when the OpenAI API is unavailable or returning errors
- [ ] In case of an error or unavailability, trigger the fallback mechanism to use the local LLM for moderation

## Update the configuration
- [ ] Add configuration options in src/config/config.json to control the fallback behavior, such as the threshold for considering OpenAI unavailable and any specific settings for the local LLM fallback
- [ ] Modify the src/config/db.js file if any changes are required for the database connection

## Test and deploy
- [ ] Write unit tests to verify that the fallback mechanism works as expected when OpenAI is unavailable
- [ ] Simulate different scenarios, such as OpenAI returning errors or being unresponsive, to ensure that the local LLM fallback is triggered correctly
- [ ] Thoroughly test the implementation to ensure that messages are being prioritized correctly and the moderation process works as expected, both with OpenAI and the local LLM fallback
- [ ] Deploy the updated application to the production environment

Note: The order of the TODO items follows the plan outlined earlier. Some steps may be worked on concurrently, while others may have dependencies that require completion of previous steps. Adjust the order as needed based on the specific implementation requirements and team structure.
