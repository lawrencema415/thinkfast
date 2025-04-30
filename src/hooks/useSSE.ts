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

  useEffect(() => {
    const baseURL = process.env.NODE_ENV === 'production'
      ? 'https://thinkfast-bice.vercel.app'
      : 'http://localhost:3000';
    
    const sse = new EventSource(`${baseURL}/api/events`);
    
    // Register event handlers
    sse.addEventListener('connected', (event) => eventHandlers.connected(event, setIsConnected));
    sse.addEventListener('playerJoined', (event) => eventHandlers.playerJoined(event, setGameState));
    sse.addEventListener('playerLeft', (event) => eventHandlers.playerLeft(event, setGameState));
    sse.addEventListener('gameStarted', (event) => eventHandlers.gameStarted(event, setGameState));
    sse.addEventListener('roundUpdate', (event) => eventHandlers.roundUpdate(event, setGameState));
    sse.addEventListener('correctGuess', (event) => eventHandlers.correctGuess(event, setGameState));
    sse.addEventListener('gameEnded', (event) => eventHandlers.gameEnded(event, setGameState));
    sse.addEventListener('roomUpdate', (event) => eventHandlers.roomUpdate(event, setGameState));
    sse.addEventListener('ping', eventHandlers.ping);

    // Handle connection errors
    sse.onerror = (error) => {
      console.error('SSE Error:', error);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      sse.close();
      setIsConnected(false);
    };
  }, []);

  return {
    isConnected,
    gameState,
    createRoom
  };
};
