import { useState, useEffect, useCallback, useRef } from 'react';

interface SSEMessage {
  message?: string;
  ping?: string;
}

export const useSSE = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Determine the base URL based on environment
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
  
  // Function to send messages (using fetch since SSE is one-way)
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) {
      console.warn('Cannot send empty message');
      return;
    }
    
    const baseURL = process.env.NODE_ENV === 'production'
      ? 'https://thinkfast-bice.vercel.app' // Production URL
      : 'http://localhost:3000'; // Development URL
    
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
  
  return { isConnected, messages, sendMessage };
};
