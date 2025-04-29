import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

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
    transports: ['polling', 'websocket'], // Explicitly define transports
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // Increase timeout values
    pingInterval: 25000
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

    // Send an initial message to confirm connection
    socket.emit('connected', { status: 'connected', id: socket.id });
  });

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler;