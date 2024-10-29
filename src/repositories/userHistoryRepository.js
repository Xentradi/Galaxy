import UserHistory from '../models/UserHistory';

class UserHistoryRepository {
  // Find a user history by ID
  async getUserHistory(userId) {
    if (!userId) throw new Error('userId is required');

    try {
      const userHistory = await UserHistory.findOne({userId});
      return userHistory || null;
    } catch (error) {
      console.error('Error fetching user history:', error);
      throw new Error('Failed to fetch user history');
    }
  }

  // Add an infraction to the user's history
  async addInfraction(userId, infraction) {
    if (!userId) throw new Error('userId is required');
    if (!infraction) throw new Error('infraction data is required');

    try {
      let userHistory = await UserHistory.findOne({userId});

      if (!userHistory) {
        userHistory = new UserHistory({
          userId,
          infractions: [],
          totalInfractions: 0
        });
      }

      userHistory.infractions.push(infraction);
      userHistory.totalInfractions = userHistory.infractions.length;
      userHistory.lastInfraction = new Date();

      return await userHistory.save();
    } catch (error) {
      console.error('Error adding infraction:', error);
      throw new Error('Failed to add infraction');
    }
  }

  // Get all infractions by userId
  async getInfractionsByUserId(userId) {
    if (!userId) throw new Error('userId is required');

    try {
      const userHistory = await UserHistory.findOne({userId})
        .select('infractions')
        .lean();
      return userHistory?.infractions || [];
    } catch (error) {
      console.error('Error fetching infractions:', error);
      throw new Error('Failed to fetch infractions');
    }
  }

  // Get infraction by ID
  async getInfractionById(userId, infractionId) {
    if (!userId) throw new Error('userId is required');
    if (!infractionId) throw new Error('infractionId is required');

    try {
      const userHistory = await UserHistory.findOne({
        userId,
        'infractions._id': infractionId
      });

      return userHistory?.infractions.find(i => i._id.toString() === infractionId) || null;
    } catch (error) {
      console.error('Error fetching infraction:', error);
      throw new Error('Failed to fetch infraction');
    }
  }

  // Get infractions by action type
  async getInfractionsByAction(userId, actionType) {
    if (!userId) throw new Error('userId is required');
    if (!actionType) throw new Error('actionType is required');

    try {
      const userHistory = await UserHistory.findOne({userId});
      return userHistory?.infractions.filter(i => i.type === actionType) || [];
    } catch (error) {
      console.error('Error fetching infractions by action:', error);
      throw new Error('Failed to fetch infractions by action');
    }
  }

  // Get infractions by severity range
  async getInfractionsBySeverityRange(userId, minSeverity, maxSeverity) {
    if (!userId) throw new Error('userId is required');
    if (typeof minSeverity !== 'number' || typeof maxSeverity !== 'number') {
      throw new Error('minSeverity and maxSeverity must be numbers');
    }

    try {
      const userHistory = await UserHistory.findOne({
        userId,
        'infractions.severity': {$gte: minSeverity, $lte: maxSeverity}
      });

      return userHistory?.infractions.filter(
        i => i.severity >= minSeverity && i.severity <= maxSeverity
      ) || [];
    } catch (error) {
      console.error('Error fetching infractions by severity:', error);
      throw new Error('Failed to fetch infractions by severity');
    }
  }

  // Get recent infractions
  async getRecentInfractions(limit = 15) {
    if (typeof limit !== 'number' || limit < 1) {
      throw new Error('limit must be a positive number');
    }

    try {
      return await UserHistory.find()
        .sort({lastInfraction: -1})
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error fetching recent infractions:', error);
      throw new Error('Failed to fetch recent infractions');
    }
  }

  // Update an infraction
  async updateInfraction(userId, infractionId, updateData) {
    if (!userId) throw new Error('userId is required');
    if (!infractionId) throw new Error('infractionId is required');
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('updateData must be an object');
    }

    try {
      const result = await UserHistory.findOneAndUpdate(
        {
          userId,
          'infractions._id': infractionId
        },
        {
          $set: {
            'infractions.$': {
              ...updateData,
              _id: infractionId
            }
          }
        },
        {new: true}
      );

      return result || null;
    } catch (error) {
      console.error('Error updating infraction:', error);
      throw new Error('Failed to update infraction');
    }
  }

  // Delete an infraction
  async deleteInfraction(userId, infractionId) {
    if (!userId) throw new Error('userId is required');
    if (!infractionId) throw new Error('infractionId is required');

    try {
      const userHistory = await UserHistory.findOne({userId});

      if (!userHistory) {
        throw new Error('User history not found');
      }

      userHistory.infractions = userHistory.infractions.filter(
        i => i._id.toString() !== infractionId
      );
      userHistory.totalInfractions = userHistory.infractions.length;

      if (userHistory.infractions.length > 0) {
        userHistory.lastInfraction = userHistory.infractions[userHistory.infractions.length - 1].timestamp;
      } else {
        userHistory.lastInfraction = null;
      }

      return await userHistory.save();
    } catch (error) {
      console.error('Error deleting infraction:', error);
      throw new Error('Failed to delete infraction');
    }
  }

  // Clear all infractions for a user
  async clearInfractions(userId) {
    if (!userId) throw new Error('userId is required');

    try {
      return await UserHistory.findOneAndUpdate(
        {userId},
        {
          $set: {
            infractions: [],
            totalInfractions: 0,
            lastInfraction: null
          }
        },
        {new: true}
      );
    } catch (error) {
      console.error('Error clearing infractions:', error);
      throw new Error('Failed to clear infractions');
    }
  }
}

export default new UserHistoryRepository();
