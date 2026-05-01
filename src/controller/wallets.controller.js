'use strict';
import express from 'express';
import { confirmRegistration } from '../services/registration.service.js';
import logger from '../config/logger.js';
const router = express.Router();
export const requireStudentAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    logger.warn({ userId: req.user?.userId, ip: req.ip }, 'wallets.unauthorized_access');
    return res.status(401).json({ success: false, message: 'Student authentication required' });
  }
  next();
};
router.post('/link', async (req, res) => {
  const { otp } = req.body;
  const studentId = req.user?.userId;
  if (!studentId) {
    logger.warn({ ip: req.ip }, 'wallets.link_failed_missing_auth');
    return res.status(401).json({ success: false, message: 'Unauthorized: Student ID missing from token' });
  }
  if (!otp) {
    return res.status(400).json({ success: false, message: 'OTP is required' });
  }
  try {
    const result = await confirmRegistration(otp, studentId);
    if (result.success) {
      logger.info({ studentId }, 'wallets.card_linked_successfully');
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (err) {
    logger.error({ err: err.message, studentId }, 'wallets.link_error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
export default router;
