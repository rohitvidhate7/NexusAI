import { Router } from 'express';
import passport from 'passport';
import { register, login, verifyEmailOTP, forgotPassword, resetPassword, oauthLogin, googleCallback, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/oauth-login', oauthLogin);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// Current user route
router.get('/me', requireAuth, getMe);

export default router;
