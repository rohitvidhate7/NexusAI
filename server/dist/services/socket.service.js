"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true
        }
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
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
