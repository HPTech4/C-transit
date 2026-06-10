import { Router } from 'express';
import { registerStudent, verifyOTP, resendOTP, loginStudent, logoutStudent, confirmCard } from '../controller/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerStudent);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginStudent);
router.post('/logout', authenticateToken, logoutStudent);

// Protected route for confirming card details
router.post('/confirm-card', authenticateToken, confirmCard);

export default router;