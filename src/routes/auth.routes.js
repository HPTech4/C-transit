import express from 'express';
import { registerStudent, loginStudent } from '../controller/user.controller.js';
const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginStudent);

export default router;