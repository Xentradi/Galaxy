import ChatMessage from '../models/ChatMessage.js';

class ChatMessageRepository {
  async create(messageData) {
    try {
      const message = new ChatMessage(messageData);
      return await message.save();
    } catch (error) {
      throw new Error(`Error creating chat message: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await ChatMessage.findById(id);
    } catch (error) {
      throw new Error(`Error finding chat message: ${error.message}`);
    }
  }

  async findByChannel(channelId, options = {}) {
    const {
      limit = 100,
      skip = 0,
      startDate,
      endDate,
      moderatedOnly = false,
    } = options;

    try {
      let query = {channelId};

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      if (moderatedOnly) {
        query.wasModerated = true;
      }

      return await ChatMessage.find(query)
        .sort({timestamp: -1})
        .skip(skip)
        .limit(limit);
    } catch (error) {
      throw new Error(`Error finding channel messages: ${error.message}`);
    }
  }

  async updateModeration(messageId, moderationData) {
    try {
      return await ChatMessage.findByIdAndUpdate(
        messageId,
        {
          wasModerated: true,
          ...moderationData,
          moderatedAt: new Date(),
        },
        {new: true}
      );
    } catch (error) {
      throw new Error(`Error updating moderation data: ${error.message}`);
    }
  }

  async getTrainingData(options = {}) {
    const {
      limit = 1000,
      skip = 0,
      moderatedOnly,
      categories,
      startDate,
      endDate,
    } = options;

    try {
      let query = {};

      if (moderatedOnly !== undefined) {
        query.wasModerated = moderatedOnly;
      }

      if (categories && categories.length > 0) {
        query.categories = {$in: categories};
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      return await ChatMessage.find(query)
        .sort({timestamp: -1})
        .skip(skip)
        .limit(limit);
    } catch (error) {
      throw new Error(`Error getting training data: ${error.message}`);
    }
  }
}

export default new ChatMessageRepository();
