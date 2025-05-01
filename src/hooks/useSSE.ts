import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/shared/schema';

interface BaseSSEMessage {
  type: 'ping' | 'system' | 'chat' | 'guess' | 'gameState';
}

interface PingMessage extends BaseSSEMessage {
  type: 'ping';
  timestamp: string;
}

interface GameMessage extends BaseSSEMessage {
  type: 'system' | 'chat' | 'guess' | 'gameState';
  payload: {
    roomId?: string;
    userId?: string;
    content?: string;
    timestamp?: string;
    gameState?: GameState;
  };
}

type SSEMessage = PingMessage | GameMessage;

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add sendMessage function
  
  useEffect(() => {
    const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://thinkfast-bice.vercel.app'
    : 'http://localhost:3000';
    
    console.log('Connecting to SSE at:', `${baseURL}/api/events`);
    
    const setupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      const sse = new EventSource(`${baseURL}/api/events`);
      eventSourceRef.current = sse;
      
      sse.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        
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
          
          if (data.type === 'ping') {
            // Handle ping message (optional)
            console.log('Received ping:', data.timestamp);
            return;
          }

          if ('payload' in data) {
            // Handle game-related messages
            switch (data.type) {
              case 'system':
              case 'chat':
              case 'guess':
                setMessages((prev) => [...prev, data.payload.content || '']);
                break;
              case 'gameState':
                // Handle game state updates if needed
                break;
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          setMessages((prev) => [...prev, event.data]);
        }
      };
      
      sse.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        sse.close();
        
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            reconnectTimeoutRef.current = null;
            setupEventSource();
          }, 5000);
        }
      };
    };
    
    setupEventSource();
    
    
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

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) {
      console.warn('Cannot send empty message');
      return;
    }
    
    const baseURL = process.env.NODE_ENV === 'production'
      ? 'https://thinkfast-bice.vercel.app'
      : 'http://localhost:3000';
    
    const encodedMessage = encodeURIComponent(message);
    const url = `${baseURL}/api/events?message=${encodedMessage}`;
    
    console.log('Sending message to:', url);

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Message sent successfully, status:', response.status);
        return response.json();
    })
      .then(data => {
        console.log('Response data:', data);
    })
      .catch(error => {
        console.error('Error sending message:', error);
    });
  }, []);
  
  return {
    isConnected,
    messages,
    sendMessage
  };
};
