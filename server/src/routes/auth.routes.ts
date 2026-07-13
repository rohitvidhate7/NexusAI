import { Router } from 'express';
import { register, login, verifyEmailOTP, forgotPassword, resetPassword, oauthLogin } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/oauth-login', oauthLogin);

export default router;
