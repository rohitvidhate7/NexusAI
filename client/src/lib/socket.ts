import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  const url = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:5000';
    
  if (socket) {
    socket.disconnect();
  }

  socket = io(url, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to real-time server');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket is not initialized. Call initSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
