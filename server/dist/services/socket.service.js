"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const backend_1 = require("@clerk/backend");
const User_js_1 = __importDefault(require("../models/User.js"));
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'https://nexusai-pm.vercel.app'
            ],
            credentials: true
        }
    });
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // 1. Try local JWT verification first
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            return next();
        }
        catch (err) {
            // Not a valid local JWT
        }
        // 2. Check for sandbox/mock tokens
        if (token.startsWith('mock-') || token === 'google-sandbox' || token === 'github-sandbox' || token.includes('sandbox')) {
            socket.user = { id: 'mock-user-id', role: 'developer' };
            return next();
        }
        // 3. Verify Clerk Session JWT if Secret Key is set
        if (process.env.CLERK_SECRET_KEY) {
            try {
                const decoded = await (0, backend_1.verifyToken)(token, {
                    secretKey: process.env.CLERK_SECRET_KEY,
                });
                const userId = decoded.sub;
                let user = await User_js_1.default.findOne({ providerId: userId });
                if (!user) {
                    // If User doesn't exist yet, we will auto-seed them
                    user = await User_js_1.default.create({
                        name: 'Clerk User',
                        email: `clerk-${userId}@nexusai-clerk.com`,
                        authProvider: 'google',
                        providerId: userId,
                        isEmailVerified: true
                    });
                }
                socket.user = {
                    id: user._id.toString(),
                    role: user.role || 'developer'
                };
                return next();
            }
            catch (clerkErr) {
                console.error('Socket Clerk verification failed:', clerkErr);
            }
        }
        next(new Error('Authentication error'));
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`);
        // Join user's personal room for direct notifications
        socket.join(socket.user.id);
        // Join workspace rooms
        socket.on('join_workspace', (workspaceId) => {
            socket.join(`workspace_${workspaceId}`);
            console.log(`User joined workspace: ${workspaceId}`);
        });
        socket.on('leave_workspace', (workspaceId) => {
            socket.leave(`workspace_${workspaceId}`);
        });
        // Chat events
        socket.on('send_message', (data) => {
            // Broadcast to channel
            io.to(`channel_${data.channelId}`).emit('receive_message', data.message);
        });
        socket.on('join_channel', (channelId) => {
            socket.join(`channel_${channelId}`);
        });
        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel_${channelId}`);
            console.log(`User left channel: ${channelId}`);
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
