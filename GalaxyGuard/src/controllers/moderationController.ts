import {Request, Response} from 'express';
import axios, {AxiosError} from 'axios';

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';

// Action thresholds
const BAN_THRESHOLD = 0.9;
const MUTE_THRESHOLD = 0.7;
const DELETE_THRESHOLD = 0.5;
const WARN_THRESHOLD = 0.3;

const CUMULATIVE_BAN_THRESHOLD = 0.7;
const CUMULATIVE_MUTE_THRESHOLD = 0.5;
const CUMULATIVE_DELETE_THRESHOLD = 0.3;
const CUMULATIVE_WARN_THRESHOLD = 0.2;

interface ModerationResponse {
  flagged: boolean;
  categories: {
    [key: string]: boolean;
  };
  category_scores: {
    [key: string]: number;
  };
}

type Action = 'allow' | 'warn' | 'delete' | 'mute' | 'ban';

const moderateMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {message} = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({error: 'Invalid or missing message in request body'});
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      res.status(500).json({error: 'OpenAI API key is not set'});
      return;
    }

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

    const normalizedCumulativeScore = cumulativeScore / Object.keys(moderationResult.category_scores).length;

    const determineAction = (score: number, cumulativeScore: number): Action => {
      if (score >= BAN_THRESHOLD || cumulativeScore >= CUMULATIVE_BAN_THRESHOLD) return 'ban';
      if (score >= MUTE_THRESHOLD || cumulativeScore >= CUMULATIVE_MUTE_THRESHOLD) return 'mute';
      if (score >= DELETE_THRESHOLD || cumulativeScore >= CUMULATIVE_DELETE_THRESHOLD) return 'delete';
      if (score >= WARN_THRESHOLD || cumulativeScore >= CUMULATIVE_WARN_THRESHOLD) return 'warn';
      return 'allow';
    };

    const action = determineAction(maxScore, normalizedCumulativeScore);

    res.status(200).json({
      action,
      message: 'Message processed',
      highestSeverity: maxScore,
      highestCategory: maxCategory,
      cumulativeScore: normalizedCumulativeScore
    });
  } catch (error) {
    console.error('Error in moderateMessage:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      res.status(axiosError.response?.status || 500).json({
        error: 'An error occurred while moderating the message',
        details: axiosError.response?.data || axiosError.message
      });
    } else {
      res.status(500).json({
        error: 'An unexpected error occurred while moderating the message',
        details: (error as Error).message
      });
    }
  }
};

export default {moderateMessage};
