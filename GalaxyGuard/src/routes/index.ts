import express from 'express';
import moderationController from '../controllers/moderationController';

const router = express.Router();

router.post('/moderate', moderationController.moderateMessage);

export default router;
