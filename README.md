# NexusAI
Your Intelligent Workspace for Project Management

NexusAI is a modern, AI-powered project management and team collaboration SaaS. Designed with premium glassmorphic aesthetics, it offers dynamic Kanban boards, live direct messaging, robust user workloads, and an integrated AI assistant.

## Features
- **Intelligent Dashboards**: Real-time workload insights, project trackers, and timeline planners.
- **Kanban Board**: Drag-and-drop task management synchronized with your entire workspace.
- **Direct Messaging & Chat**: Real-time private threads, group chats, and unread notifications via WebSockets.
- **Team Management**: Detailed user profiles, access control (roles), and dynamic workload gauges.
- **AI Assistant Contextual Support**: Leverage an intelligent conversational agent that understands your workspace data.
- **Global Command Palette**: Lightning-fast fuzzy search across the entire platform via `Ctrl+K` or `Cmd+K`.

## Tech Stack
**Frontend:**
- React (Vite)
- TypeScript
- Framer Motion (Animations)
- React Query (Data Fetching)
- Tailwind / CSS Modules
- Lucide Icons

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- Socket.IO (Real-time events)
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- MongoDB instance (local or Atlas)
- Cloudinary Account (for file uploads)
- Google Gemini API Key (for AI assistant)

### Installation
1. Clone the repository and install dependencies in both client and server directories:
   ```bash
   cd server
   npm install
   
   cd ../client
   npm install
   ```

2. Setup your `.env` variables in the `server` directory.
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start the application.
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

4. Navigate to `http://localhost:5173` to access the application.

## Deployment
NexusAI is ready for modern PaaS platforms:
- **Frontend**: Deploy via Vercel, Netlify, or AWS Amplify. Make sure to define the `VITE_API_URL` environment variable.
- **Backend**: Deploy via Render, Railway, or Heroku. Ensure all `.env` variables are configured in the cloud dashboard.

## Authors
Created by Rohit Vidhate / NexusAI Core Team.
