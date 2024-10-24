import {Request, Response} from 'express';
import axios, {AxiosError} from 'axios';
import config from '../config/moderation.config';

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

class ModerationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

const validateApiKey = (): void => {
  if (!config.openai.apiKey) {
    throw new ModerationError(
      'OpenAI API key is not configured',
      500,
      'Please set the OPENAI_API_KEY environment variable'
    );
  }
};

const validateMessage = (message: any): void => {
  if (!message || typeof message !== 'string') {
    throw new ModerationError(
      'Invalid or missing message',
      400,
      'Message must be a non-empty string'
    );
  }
};

const determineAction = (score: number, cumulativeScore: number): Action => {
  const {individual, cumulative} = config.thresholds;

  if (score >= individual.ban || cumulativeScore >= cumulative.ban) return 'ban';
  if (score >= individual.mute || cumulativeScore >= cumulative.mute) return 'mute';
  if (score >= individual.delete || cumulativeScore >= cumulative.delete) return 'delete';
  if (score >= individual.warn || cumulativeScore >= cumulative.warn) return 'warn';
  return 'allow';
};

const calculateScores = (moderationResult: ModerationResponse) => {
  let maxScore = 0;
  let maxCategory = '';
  let cumulativeScore = 0;
  const categories = Object.entries(moderationResult.category_scores);

  for (const [category, score] of categories) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category;
    }
    cumulativeScore += score;
  }

  const normalizedCumulativeScore = cumulativeScore / categories.length;

  return {
    maxScore,
    maxCategory,
    normalizedCumulativeScore
  };
};

const moderateMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const {message} = req.body;

    // Validate inputs
    validateApiKey();
    validateMessage(message);

    // Make API request
    let response;
    try {
      response = await axios.post<ModerationResponse>(
        config.openai.moderationUrl,
        {input: message},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openai.apiKey}`,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new ModerationError(
          'OpenAI API request failed',
          axiosError.response?.status || 500,
          axiosError.response?.data || axiosError.message
        );
      }
      throw error;
    }

    const moderationResult = response.data;
    const {maxScore, maxCategory, normalizedCumulativeScore} = calculateScores(moderationResult);
    const action = determineAction(maxScore, normalizedCumulativeScore);

    res.status(200).json({
      action,
      message: 'Message processed successfully',
      highestSeverity: maxScore,
      highestCategory: maxCategory,
      cumulativeScore: normalizedCumulativeScore,
      details: {
        flagged: moderationResult.flagged,
        categories: moderationResult.categories,
        categoryScores: moderationResult.category_scores
      }
    });

  } catch (error) {
    console.error('Error in moderateMessage:', error);

    if (error instanceof ModerationError) {
      res.status(error.statusCode).json({
        error: error.message,
        details: error.details
      });
      return;
    }

    res.status(500).json({
      error: 'An unexpected error occurred while moderating the message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default {moderateMessage};
