import mongoose from 'mongoose';
import {UserSettingsService} from '../services/userSettingsService';
import UserSettings from '../models/UserSettings';
import config from '../config/moderation.config';

// Mock the mongoose model
jest.mock('../models/UserSettings');
const MockUserSettings = UserSettings as jest.Mocked<typeof UserSettings>;

describe('UserSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with generated API key and default thresholds', async () => {
      const userId = 'test-user-123';
      const mockSave = jest.fn().mockResolvedValue({
        userId,
        apiKey: expect.any(String),
        thresholds: config.defaultThresholds
      });

      MockUserSettings.prototype.save = mockSave;

      const result = await UserSettingsService.createUser(userId);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userId);
      expect(result.apiKey).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(result.thresholds).toEqual(config.defaultThresholds);
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle duplicate user ID error', async () => {
      const userId = 'existing-user';
      const duplicateError = new mongoose.Error.ValidationError();
      MockUserSettings.prototype.save = jest.fn().mockRejectedValue(duplicateError);

      await expect(UserSettingsService.createUser(userId)).rejects.toThrow();
    });
  });

  describe('getUserSettings', () => {
    it('should retrieve user settings by user ID', async () => {
      const userId = 'test-user-123';
      const mockUser = {
        userId,
        apiKey: 'test-api-key',
        thresholds: config.defaultThresholds
      };

      MockUserSettings.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await UserSettingsService.getUserSettings(userId);

      expect(result).toEqual(mockUser);
      expect(MockUserSettings.findOne).toHaveBeenCalledWith({userId});
    });

    it('should return null for non-existent user', async () => {
      MockUserSettings.findOne = jest.fn().mockResolvedValue(null);

      const result = await UserSettingsService.getUserSettings('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserByApiKey', () => {
    it('should retrieve user settings by API key', async () => {
      const apiKey = 'test-api-key';
      const mockUser = {
        userId: 'test-user-123',
        apiKey,
        thresholds: config.defaultThresholds
      };

      MockUserSettings.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await UserSettingsService.getUserByApiKey(apiKey);

      expect(result).toEqual(mockUser);
      expect(MockUserSettings.findOne).toHaveBeenCalledWith({apiKey});
    });

    it('should return null for invalid API key', async () => {
      MockUserSettings.findOne = jest.fn().mockResolvedValue(null);

      const result = await UserSettingsService.getUserByApiKey('invalid-key');

      expect(result).toBeNull();
    });
  });

  describe('updateUserSettings', () => {
    it('should update user settings successfully', async () => {
      const userId = 'test-user-123';
      const newSettings = {
        thresholds: {
          individual: {
            ban: 0.95,
            mute: 0.75,
            delete: 0.55,
            warn: 0.35
          },
          cumulative: {
            ban: 0.75,
            mute: 0.55,
            delete: 0.35,
            warn: 0.25
          }
        }
      };

      const mockUpdatedUser = {
        userId,
        apiKey: 'test-api-key',
        ...newSettings
      };

      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await UserSettingsService.updateUserSettings(userId, newSettings);

      expect(result).toEqual(mockUpdatedUser);
      expect(MockUserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        {userId},
        {$set: newSettings},
        {new: true}
      );
    });

    it('should return null when updating non-existent user', async () => {
      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const result = await UserSettingsService.updateUserSettings('non-existent', {});

      expect(result).toBeNull();
    });
  });

  describe('updateOpenAIKey', () => {
    it('should update OpenAI API key successfully', async () => {
      const userId = 'test-user-123';
      const openaiApiKey = 'new-openai-key';
      const mockUpdatedUser = {
        userId,
        apiKey: 'test-api-key',
        openaiApiKey
      };

      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await UserSettingsService.updateOpenAIKey(userId, openaiApiKey);

      expect(result).toEqual(mockUpdatedUser);
      expect(MockUserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        {userId},
        {$set: {openaiApiKey}},
        {new: true}
      );
    });

    it('should return null when updating OpenAI key for non-existent user', async () => {
      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const result = await UserSettingsService.updateOpenAIKey('non-existent', 'new-key');

      expect(result).toBeNull();
    });
  });

  describe('updateThresholds', () => {
    it('should update thresholds successfully', async () => {
      const userId = 'test-user-123';
      const newThresholds = {
        individual: {
          ban: 0.95,
          mute: 0.75,
          delete: 0.55,
          warn: 0.35
        },
        cumulative: {
          ban: 0.75,
          mute: 0.55,
          delete: 0.35,
          warn: 0.25
        }
      };

      const mockUpdatedUser = {
        userId,
        apiKey: 'test-api-key',
        thresholds: newThresholds
      };

      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await UserSettingsService.updateThresholds(userId, newThresholds);

      expect(result).toEqual(mockUpdatedUser);
      expect(MockUserSettings.findOneAndUpdate).toHaveBeenCalledWith(
        {userId},
        {$set: {thresholds: newThresholds}},
        {new: true}
      );
    });

    it('should return null when updating thresholds for non-existent user', async () => {
      MockUserSettings.findOneAndUpdate = jest.fn().mockResolvedValue(null);

      const result = await UserSettingsService.updateThresholds('non-existent', {
        individual: {ban: 0.9, mute: 0.7, delete: 0.5, warn: 0.3},
        cumulative: {ban: 0.7, mute: 0.5, delete: 0.3, warn: 0.2}
      });

      expect(result).toBeNull();
    });
  });
});
