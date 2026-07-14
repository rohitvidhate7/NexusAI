"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const backend_1 = require("@clerk/backend");
const clerkClient = (0, backend_1.createClerkClient)({ secretKey: process.env.CLERK_SECRET_KEY });
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }
        const token = authHeader.split(' ')[1];
        // 1. Try local JWT verification first
        try {
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            req.user = decoded;
            return next();
        }
        catch (err) {
            // Token is not a valid local JWT. Proceed to Clerk or sandbox checks.
        }
        // 2. Check for sandbox/mock tokens during testing/development
        if (token.startsWith('mock-') || token === 'google-sandbox' || token === 'github-sandbox' || token.includes('sandbox')) {
            req.user = { id: 'mock-user-id', role: 'developer' };
            return next();
        }
        // 3. Verify Clerk Session JWT if Secret Key is set
        if (process.env.CLERK_SECRET_KEY) {
            const decoded = await (0, backend_1.verifyToken)(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
            const userId = decoded.sub;
            const User = (await import('../models/User.js')).default;
            let user = await User.findOne({ providerId: userId });
            if (!user) {
                try {
                    const clerkUser = await clerkClient.users.getUser(userId);
                    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
                    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Clerk User';
                    user = await User.create({
                        name,
                        email,
                        authProvider: 'google',
                        providerId: userId,
                        isEmailVerified: true
                    });
                }
                catch (clerkErr) {
                    // If Clerk API fails or doesn't find the user, fallback to creating a generic user document
                    user = await User.create({
                        name: 'Clerk User',
                        email: `clerk-${userId}@nexusai-clerk.com`,
                        authProvider: 'google',
                        providerId: userId,
                        isEmailVerified: true
                    });
                }
            }
            req.user = {
                id: user._id.toString(),
                role: user.role || 'developer',
            };
            return next();
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
    catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
        next();
    }
    else {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
};
exports.requireAdmin = requireAdmin;
