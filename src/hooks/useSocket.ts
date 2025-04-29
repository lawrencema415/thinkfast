import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determine the base URL based on environment
    const baseURL = process.env.NODE_ENV === 'production'
      ? 'https://thinkfast-bice.vercel.app' // Production URL
      : 'http://localhost:3000'; // Development URL
    
    // Initialize socket connection with improved configuration
    const socketInstance = io(baseURL, {
      path: '/api/socket',
      transports: ['polling', 'websocket'], // Start with polling, then upgrade to websocket
      addTrailingSlash: false, // Important for Vercel deployments
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Force a new connection
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setIsConnected(false);
    });

    // Add more detailed error logging
    socketInstance.on('error', (err) => {
      console.error('Socket error:', err);
      setIsConnected(false);
    });

    // Add reconnect event handlers
    socketInstance.io.on('reconnect', (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
      setIsConnected(true);
    });

    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`Socket reconnection attempt: ${attempt}`);
    });

    socketInstance.io.on('reconnect_error', (err) => {
      console.error('Socket reconnection error:', err);
    });

    socketInstance.io.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });

    // Save socket instance
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Function to send messages
  const sendMessage = useCallback(
    (message: string) => {
      if (socket && isConnected) {
        socket.emit('message', message);
      } else {
        console.warn('Cannot send message: Socket not connected');
      }
    },
    [socket, isConnected]
  );

  return { socket, isConnected, sendMessage };
};