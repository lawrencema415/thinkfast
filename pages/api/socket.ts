import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { Server as NetServer } from 'http';
import type { NextApiResponse } from 'next';

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Socket is initializing');
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    transports: ['websocket', 'polling']
  });
  res.socket.server.io = io;

  io.on('connection', socket => {
    console.log('Client connected');
    
    socket.on('message', msg => {
      io.emit('message', msg);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler;