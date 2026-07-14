import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { verifyToken as verifyClerkToken } from '@clerk/backend';
import User from '../models/User.js';

let io: SocketServer;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      (socket as any).user = decoded;
      return next();
    } catch (err) {
      // Not a valid local JWT
    }

    // 2. Check for sandbox/mock tokens
    if (token.startsWith('mock-') || token === 'google-sandbox' || token === 'github-sandbox' || token.includes('sandbox')) {
      (socket as any).user = { id: 'mock-user-id', role: 'developer' };
      return next();
    }

    // 3. Verify Clerk Session JWT if Secret Key is set
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const decoded = await verifyClerkToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const userId = decoded.sub;
        
        let user = await User.findOne({ providerId: userId });
        if (!user) {
          // If User doesn't exist yet, we will auto-seed them
          user = await User.create({
            name: 'Clerk User',
            email: `clerk-${userId}@nexusai-clerk.com`,
            authProvider: 'google',
            providerId: userId,
            isEmailVerified: true
          });
        }

        (socket as any).user = {
          id: user._id.toString(),
          role: user.role || 'developer'
        };
        return next();
      } catch (clerkErr) {
        console.error('Socket Clerk verification failed:', clerkErr);
      }
    }

    next(new Error('Authentication error'));
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${(socket as any).user.id}`);

    // Join user's personal room for direct notifications
    socket.join((socket as any).user.id);

    // Join workspace rooms
    socket.on('join_workspace', (workspaceId: string) => {
      socket.join(`workspace_${workspaceId}`);
      console.log(`User joined workspace: ${workspaceId}`);
    });

    socket.on('leave_workspace', (workspaceId: string) => {
      socket.leave(`workspace_${workspaceId}`);
    });

    // Chat events
    socket.on('send_message', (data: { channelId: string, message: any }) => {
      // Broadcast to channel
      io.to(`channel_${data.channelId}`).emit('receive_message', data.message);
    });

    socket.on('join_channel', (channelId: string) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${(socket as any).user.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
