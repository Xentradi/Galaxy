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

    // Implement logic to determine action
    let action = 'allow'; // Default action


    // Update the ModerationResponse interface
    interface ModerationResponse {
      flagged: boolean;
      categories: {
        [key: string]: boolean;
      }
      category_scores: {
        [key: string]: number;
      }
    }

    // Find the highest scoring category and calculate cumulative score
    let maxScore = 0;
    let maxCategory = '';
    let cumulativeScore = 0;

    for (const [category, score] of Object.entries(moderationResult.category_scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
      cumulativeScore += score;
    }

    // Normalize cumulative score (assuming 7 categories as per OpenAI's documentation)
    const normalizedCumulativeScore = cumulativeScore / 7;

    // Determine action based on both highest individual score and cumulative score
    if (maxScore >= 0.9 || normalizedCumulativeScore >= 0.7) {
      action = 'ban';
    } else if (maxScore >= 0.7 || normalizedCumulativeScore >= 0.5) {
      action = 'mute';
    } else if (maxScore >= 0.5 || normalizedCumulativeScore >= 0.3) {
      action = 'delete';
    } else if (maxScore >= 0.3 || normalizedCumulativeScore >= 0.2) {
      action = 'warn';
    }

    res.status(200).json({
      action,
      message: 'Message processed',
      highestSeverity: maxScore,
      highestCategory: maxCategory,
      cumulativeScore: normalizedCumulativeScore
    });
  } catch (error) {
    res.status(500).json({error: 'An error occurred while moderating the message'});
  }
};

export default {moderateMessage};
