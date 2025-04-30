import { useState, useEffect, useCallback } from 'react';
import { eventHandlers } from '@/events/handlers';
import { GameState, Player, Track } from '@shared/schema';

interface CreateRoomParams {
    songsPerPlayer: number;
    timePerSong: number;
}

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Add createRoom function
  const createRoom = useCallback(async (params: CreateRoomParams) => {
    try {
      const baseURL = process.env.NODE_ENV === 'production'
        ? 'https://thinkfast-bice.vercel.app'
        : 'http://localhost:3000';

      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomData = {
          room: {
              code: roomCode,
              songsPerPlayer: params.songsPerPlayer,
              timePerSong: params.timePerSong,
              isActive: true,
              isPlaying: false,
              createdAt: new Date()
          }
      };

      const response = await fetch(`${baseURL}/api/events?eventType=roomUpdate&eventData=${encodeURIComponent(JSON.stringify(roomData))}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          throw new Error('Failed to create room');
      }

      return roomData.room; // Return the room object directly
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }, []);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const baseURL = process.env.NODE_ENV === 'production'
      ? 'https://thinkfast-bice.vercel.app' // Production URL
      : 'http://localhost:3000'; // Development URL
    
    console.log('Connecting to SSE at:', `${baseURL}/api/events`);
    
    // Function to create and set up the EventSource
    const setupEventSource = () => {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create EventSource for SSE
      const sse = new EventSource(`${baseURL}/api/events`);
      eventSourceRef.current = sse;
      
      // Set up event listeners
      sse.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      sse.onmessage = (event) => {
        console.log('Raw SSE event received:', event.data);
        
        try {
          const data: SSEMessage = JSON.parse(event.data);
          console.log('SSE message parsed:', data);
          
          if (data.message) {
            console.log('Adding message to state:', data.message);
            setMessages((prev) => [...prev, data.message as string]);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          // If not valid JSON, add as plain text
          setMessages((prev) => [...prev, event.data]);
        }
      };
      
      sse.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        
        // Close the current connection
        sse.close();
        
        // Set up a reconnection timeout
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            reconnectTimeoutRef.current = null;
            setupEventSource();
          }, 5000); // Try to reconnect after 5 seconds
        }
      };
    };
    
    // Initial setup
    setupEventSource();
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up SSE connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
    };
  }, []);

  return {
    isConnected,
    gameState,
    createRoom
  };
};
