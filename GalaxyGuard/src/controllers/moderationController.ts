import {Request, Response} from 'express';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';

/**
 * Type definition for the OpenAI moderation response.
 */
interface ModerationResponse {
  flagged: boolean;
  // Add other relevant fields based on the actual API response
}

/**
 * Moderates a message using the OpenAI API and determines the appropriate action.
 * @param {Request} req - The request object containing the message to moderate.
 * @param {Response} res - The response object to send the moderation result.
 */
const moderateMessage = async (req: Request, res: Response) => {
  try {
    const {message} = req.body;

    // Make a request to the OpenAI moderation endpoint
    const response = await axios.post<ModerationResponse>(
      OPENAI_MODERATION_URL,
      {input: message},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const moderationResult = response.data;

    // Implement weighted logic to determine action
    let action = 'allow'; // Default action
    // Example logic (to be expanded with actual weighted logic)
    if (moderationResult.flagged) {
      action = 'delete';
    }

    res.status(200).json({action, message: 'Message processed'});
  } catch (error) {
    res.status(500).json({error: 'An error occurred while moderating the message'});
  }
};

export default {moderateMessage};
