import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Initialize socket connection
        await fetch('/api/socket');
        
        const socketInstance = io('', {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          autoConnect: true
        });

        socketInstance.on('connect', () => {
          console.log('Connected to WebSocket');
          setIsConnected(true);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socketInstance.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
          setIsConnected(false);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessage = useCallback((message: any) => {
    if (socket) {
      socket.emit('message', message);
    }
  }, [socket]);

  return { socket, isConnected, sendMessage };
};