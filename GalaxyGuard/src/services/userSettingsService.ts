import crypto from 'crypto';
import UserSettings from '../models/UserSettings';
import config from '../config/moderation.config';

export class UserSettingsService {
  static async createUser(userId: string): Promise<UserSettings> {
    const apiKey = crypto.randomBytes(32).toString('hex');

    const userSettings = new UserSettings({
      userId,
      apiKey,
      thresholds: config.defaultThresholds
    });

    return await userSettings.save();
  }

  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    return await UserSettings.findOne({userId});
  }

  static async getUserByApiKey(apiKey: string): Promise<UserSettings | null> {
    return await UserSettings.findOne({apiKey});
  }

  static async updateUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<UserSettings | null> {
    return await UserSettings.findOneAndUpdate(
      {userId},
      {$set: settings},
      {new: true}
    );
  }

  static async updateOpenAIKey(
    userId: string,
    openaiApiKey: string
  ): Promise<UserSettings | null> {
    return await UserSettings.findOneAndUpdate(
      {userId},
      {$set: {openaiApiKey}},
      {new: true}
    );
  }

  static async updateThresholds(
    userId: string,
    thresholds: UserSettings['thresholds']
  ): Promise<UserSettings | null> {
    return await UserSettings.findOneAndUpdate(
      {userId},
      {$set: {thresholds}},
      {new: true}
    );
  }
}

export default UserSettingsService;
