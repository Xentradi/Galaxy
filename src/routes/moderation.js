const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');

// Define a route for moderation
router.post('/moderate', moderationController.moderateContent);

module.exports = router;
