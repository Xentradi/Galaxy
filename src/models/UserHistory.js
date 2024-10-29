import mongoose from 'mongoose';
import {ModAction, ContentCategory} from './constants.js';

const UserHistorySchema = new mongoose.Schema({
  infactionId: {type: String, required: true, index: true},
  userId: {type: String, required: true, index: true},
  infractions: [{
    type: {type: String, enum: Object.values(ModAction)},
    category: {type: String, enum: Object.values(ContentCategory)},
    severity: Number,
    timestamp: Date,
    content: String,
    context: Object,
    action: String,
    decay: Date
  }],
  lastInfraction: Date,
  totalInfractions: {type: Number, default: 0},
  created: {type: Date, default: Date.now}
});

// Index for efficient querying
UserHistorySchema.index({userId: 1, 'infractions.timestamp': -1});

export default mongoose.model('UserHistory', UserHistorySchema);
