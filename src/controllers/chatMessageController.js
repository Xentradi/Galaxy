import chatMessageRepository from '../repositories/chatMessageRepository.js';

export const storeChatMessage = async (req, res) => {
  try {
    const messageData = req.body;
    const savedMessage = await chatMessageRepository.create(messageData);
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const updateModeration = async (req, res) => {
  try {
    const {messageId} = req.params;
    const moderationData = req.body;
    const updatedMessage = await chatMessageRepository.updateModeration(messageId, moderationData);

    if (!updatedMessage) {
      return res.status(404).json({error: 'Message not found'});
    }

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getChannelMessages = async (req, res) => {
  try {
    const {channelId} = req.params;
    const options = {
      limit: parseInt(req.query.limit) || 100,
      skip: parseInt(req.query.skip) || 0,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      moderatedOnly: req.query.moderatedOnly === 'true',
    };

    const messages = await chatMessageRepository.findByChannel(channelId, options);
    res.json(messages);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const getTrainingData = async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 1000,
      skip: parseInt(req.query.skip) || 0,
      moderatedOnly: req.query.moderatedOnly === 'true',
      categories: req.query.categories ? req.query.categories.split(',') : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const data = await chatMessageRepository.getTrainingData(options);
    res.json(data);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};
