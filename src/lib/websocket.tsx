'use client';

import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
	ReactNode,
} from 'react';

// Define types for WebSocket messages
export type WebSocketMessage = {
	type: string;
	payload: any;
};

type WebSocketContextType = {
	sendMessage: (message: WebSocketMessage) => void;
	connected: boolean;
	lastMessage: WebSocketMessage | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
	const [connected, setConnected] = useState(false);
	const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
	const socket = useRef<WebSocket | null>(null);
	const reconnectAttempts = useRef(0);
	const maxReconnectAttempts = 5;

	// Initialize WebSocket connection with reconnection
	useEffect(() => {
		let reconnectTimer: NodeJS.Timeout;
		const reconnectInterval = 3000; // Reconnect every 3 seconds if connection fails

		const connectWebSocket = () => {
			try {
				const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
				const wsPath = import.meta.env.PROD ? '/custom-ws' : '/ws';
				const wsUrl = `${protocol}//${window.location.host}${wsPath}`;

				console.log('[websocket] Attempting connection to:', wsUrl);
				console.log('[websocket] Environment:', import.meta.env.MODE);
				console.log('[websocket] Protocol:', protocol);
				console.log('[websocket] Host:', window.location.host);
				console.log('[websocket] Path:', wsPath);

				const ws = new WebSocket(wsUrl);
				socket.current = ws;

				ws.onopen = () => {
					console.log('[websocket] Connection established successfully');
					setConnected(true);
					reconnectAttempts.current = 0;

					// Clear any reconnect timers
					if (reconnectTimer) {
						clearTimeout(reconnectTimer);
					}
				};

				ws.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data) as WebSocketMessage;
						console.log('[websocket] Received message:', message.type);
						setLastMessage(message);
					} catch (error) {
						console.error('[websocket] Failed to parse message:', error);
					}
				};

				ws.onclose = (event) => {
					console.log(
						`[websocket] Connection closed - Code: ${event.code}, Reason: ${
							event.reason || 'No reason provided'
						}, Clean: ${event.wasClean}`
					);
					setConnected(false);

					// Attempt to reconnect unless the close was intentional or max attempts reached
					if (
						event.code !== 1000 &&
						reconnectAttempts.current < maxReconnectAttempts
					) {
						reconnectAttempts.current += 1;
						console.log(
							`[websocket] Attempting reconnect ${
								reconnectAttempts.current
							}/${maxReconnectAttempts} in ${
								reconnectInterval / 1000
							} seconds...`
						);
						reconnectTimer = setTimeout(connectWebSocket, reconnectInterval);
					} else if (reconnectAttempts.current >= maxReconnectAttempts) {
						console.log('[websocket] Max reconnection attempts reached');
					}
				};

				ws.onerror = (error) => {
					console.error('[websocket] Error:', error);
					setConnected(false);
				};
			} catch (error) {
				console.error('[websocket] Setup error:', error);
			}
		};

		// Initial connection
		connectWebSocket();

		// Clean up the WebSocket connection on unmount
		return () => {
			if (
				socket.current &&
				(socket.current.readyState === WebSocket.OPEN ||
					socket.current.readyState === WebSocket.CONNECTING)
			) {
				socket.current.close(1000, 'Component unmounted');
			}

			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
			}
		};
	}, []);

	// Send a message to the server
	const sendMessage = useCallback((message: WebSocketMessage) => {
		if (socket.current?.readyState === WebSocket.OPEN) {
			socket.current.send(JSON.stringify(message));
		} else {
			console.warn('[websocket] Cannot send message - connection not open');
		}
	}, []);

	return (
		<WebSocketContext.Provider value={{ sendMessage, connected, lastMessage }}>
			{children}
		</WebSocketContext.Provider>
	);
};

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error('useWebSocket must be used within a WebSocketProvider');
	}
	return context;
};

// Custom hook for listening to specific message types
export const useWebSocketListener = (
	messageType: string,
	callback: (payload: any) => void
) => {
	const { lastMessage } = useWebSocket();

	useEffect(() => {
		if (lastMessage && lastMessage.type === messageType) {
			callback(lastMessage.payload);
		}
	}, [lastMessage, messageType, callback]);
};
