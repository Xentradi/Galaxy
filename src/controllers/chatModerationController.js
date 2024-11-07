import {moderateContent} from './moderationController.js';
import chatMessageRepository from '../repositories/chatMessageRepository.js';

export const captureAndModerate = async (req, res) => {
  try {
    // 1. Store the message first
    const messageData = req.body;
    const savedMessage = await chatMessageRepository.create(messageData);

    // 2. Then moderate it
    const moderationReq = {
      body: {
        content: messageData.content,
        channelType: messageData.channelType,
        channelId: messageData.channelId
      },
      userId: req.userId
    };

    // Call moderation logic
    const moderationRes = {
      json: (data) => {
        // Update the stored message with moderation results
        chatMessageRepository.updateModeration(savedMessage._id, {
          moderationType: data.action,
          moderationReason: data.analysis.flaggedCategory,
          toxicityScore: data.severity,
          categories: Object.entries(data.analysis.categories)
            .filter(([_, severity]) => severity !== 'none')
            .map(([category]) => category)
        });

        // Return combined response
        return res.json({
          message: savedMessage,
          moderation: data
        });
      },
      status: (code) => ({
        json: (data) => res.status(code).json({
          message: savedMessage,
          moderation: data
        })
      })
    };

    // Perform moderation
    await moderateContent(moderationReq, moderationRes);

  } catch (error) {
    console.error('Error in capture and moderate:', error);
    res.status(500).json({
      error: error.message
    });
  }
};
