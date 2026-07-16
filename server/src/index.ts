import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import path from 'path';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Ensure local assets can be requested from other origins
}));
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://nexusai-pm.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NexusAI API is running' });
});

import passport from './config/passport.js';

// Routes will be imported here
app.use(passport.initialize());
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import chatRoutes from './routes/chat.routes';

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

import http from 'http';
import { initializeSocket } from './services/socket.service';

const server = http.createServer(app);
initializeSocket(server);

// Connect to Database and start server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  });
}

// Active reload trigger
export default app;
