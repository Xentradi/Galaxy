import mongoose, {Document, Schema} from 'mongoose';

export interface UserSettings extends Document {
  userId: string;
  apiKey: string;
  openaiApiKey?: string;
  thresholds: {
    individual: {
      ban: number;
      mute: number;
      delete: number;
      warn: number;
    };
    cumulative: {
      ban: number;
      mute: number;
      delete: number;
      warn: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<UserSettings>({
  userId: {type: String, required: true, unique: true},
  apiKey: {type: String, required: true, unique: true},
  openaiApiKey: {type: String},
  thresholds: {
    individual: {
      ban: {type: Number, default: 0.9},
      mute: {type: Number, default: 0.7},
      delete: {type: Number, default: 0.5},
      warn: {type: Number, default: 0.3}
    },
    cumulative: {
      ban: {type: Number, default: 0.7},
      mute: {type: Number, default: 0.5},
      delete: {type: Number, default: 0.3},
      warn: {type: Number, default: 0.2}
    }
  }
}, {
  timestamps: true
});

export default mongoose.model<UserSettings>('UserSettings', UserSettingsSchema);
