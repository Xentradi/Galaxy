import mongoose from 'mongoose';

const oAuthClientSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  scope: [{
    type: String,
    enum: ['read', 'write', 'admin'],
    default: ['read']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  }
});

// Update lastUsed timestamp when client authenticates
oAuthClientSchema.methods.updateLastUsed = function () {
  this.lastUsed = new Date();
  return this.save();
};

// Method to validate client secret
oAuthClientSchema.methods.validateSecret = function (secret) {
  return this.clientSecret === secret;
};

const OAuthClient = mongoose.model('OAuthClient', oAuthClientSchema);

export default OAuthClient;
