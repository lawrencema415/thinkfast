import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if socket.io server is already initialized
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((res.socket as any).server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const io = new SocketIOServer((res.socket as any).server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store the socket.io server instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res.socket as any).server.io = io;

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('message', (data) => {
      console.log('Message received:', data);
      // Echo the message back to the client
      socket.emit('message', `Server received: ${data}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  res.end();
}

// Add this to ensure the API route is properly handled by Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};