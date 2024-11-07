import express from 'express';
import {moderateContent} from '../controllers/moderationController.js';

const router = express.Router();

// Define a route for moderation
router.post('/moderate', moderateContent);

export default router;
