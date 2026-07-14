"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/verify-otp', auth_controller_1.verifyEmailOTP);
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
router.post('/oauth-login', auth_controller_1.oauthLogin);
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false }), auth_controller_1.googleCallback);
// Current user route
router.get('/me', auth_1.requireAuth, auth_controller_1.getMe);
exports.default = router;
