import express from 'express';
import authService from '../services/authService.js';
import OAuthClient from '../models/OAuthClient.js';
import {validateClientCredentials} from '../middleware/authMiddleware.js';

const router = express.Router();

// OAuth2 token endpoint
router.post('/oauth/token', validateClientCredentials, async (req, res) => {
  try {
    const {grant_type} = req.body;

    // Only support client_credentials grant type for now
    if (grant_type !== 'client_credentials') {
      return res.status(400).json({
        message: 'Unsupported grant type'
      });
    }

    const tokenResponse = await authService.generateAccessToken(req.oauthClient);
    res.json(tokenResponse);
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({message: 'Error generating token'});
  }
});

// Create new client credentials (admin only)
router.post('/clients', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const {name, scope = ['read']} = req.body;

    if (!name) {
      return res.status(400).json({message: 'Client name is required'});
    }

    const {clientId, clientSecret} = authService.generateClientCredentials();

    const client = new OAuthClient({
      clientId,
      clientSecret,
      name,
      scope
    });

    await client.save();

    // Return credentials (only time client secret will be shown)
    res.status(201).json({
      clientId,
      clientSecret,
      name,
      scope
    });
  } catch (error) {
    console.error('Client creation error:', error);
    res.status(500).json({message: 'Error creating client'});
  }
});

// Revoke client access
router.delete('/clients/:clientId', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const {clientId} = req.params;

    const client = await OAuthClient.findOne({clientId});
    if (!client) {
      return res.status(404).json({message: 'Client not found'});
    }

    client.isActive = false;
    await client.save();

    res.status(204).send();
  } catch (error) {
    console.error('Client revocation error:', error);
    res.status(500).json({message: 'Error revoking client'});
  }
});

// List clients (admin only)
router.get('/clients', async (req, res) => {
  try {
    // TODO: Add admin authentication
    const clients = await OAuthClient.find(
      {},
      {clientSecret: 0} // Exclude client secret from response
    );
    res.json(clients);
  } catch (error) {
    console.error('Client list error:', error);
    res.status(500).json({message: 'Error listing clients'});
  }
});

export default router;
