'use client';

import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
	useCallback,
} from 'react';
import {
	useQuery,
	useMutation,
	UseMutationResult,
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSSE } from '@/hooks/useSSE';
import type { InsertRoom, GameState, Song, Room } from '../shared/schema';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type SongInput = {
	title: string;
	artist: string;
	albumArt: string;
	genre: string;
	sourceType: string;
	sourceId: string;
	previewUrl: string | null;
};

type DeleteSongResult = {
	songId: number;
};

type GameMessage = {
	type: string;
	payload: Record<string, unknown>;
};

type GameContextType = {
	gameState: GameState | null;
	isLoading: boolean;
	error: Error | null;
	createRoomMutation: UseMutationResult<
		Room,
		Error,
		Omit<InsertRoom, 'hostId' | 'code'>
	>;
	joinRoomMutation: UseMutationResult<Room, Error, string>;
	leaveRoomMutation: UseMutationResult<void, Error, void>;
	addSongMutation: UseMutationResult<Song, Error, SongInput>;
	startGameMutation: UseMutationResult<void, Error, void>;
	makeGuessMutation: UseMutationResult<void, Error, string>;
	playAgainMutation: UseMutationResult<void, Error, void>;
	endGameMutation: UseMutationResult<void, Error, void>;
	sendChatMessage: (message: string) => void;
	controlPlayback: (action: 'play' | 'pause') => void;
	makeGuess: (guess: string) => void;
	deleteSongMutation: UseMutationResult<DeleteSongResult, Error, number>;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
	const { toast } = useToast();
	const { user } = useAuth();
	const { isConnected, messages, sendMessage } = useSSE();
	const [gameState, setGameState] = useState<GameState | null>(null);
	const router = useRouter();

	// Fetch current game state if the user is in a room
	const {
		isLoading,
		error,
		data: fetchedGameState,
	} = useQuery<GameState | null, Error>({
		queryKey: ['/api/game/state'],
		queryFn: async () => {
			// TODO: This is fetching on home page, incorrect, need to debug
			const res = await fetch('/api/game/state', {
				credentials: 'include',
			});

			if (res.status === 401) {
				return null;
			}

			if (!res.ok) {
				const text = await res.text();
				throw new Error(`${res.status}: ${text || res.statusText}`);
			}

			return await res.json();
		},
		enabled: !!user,
	});

	// Update game state from fetched data
	useEffect(() => {
		// Always update, even if the object reference is the same
		setGameState(fetchedGameState ?? null);
	}, [fetchedGameState]);

	// Listen for SSE messages
	useEffect(() => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			// Skip connection status messages
			if (lastMessage === 'Connected to SSE') {
				return;
			}
			try {
				const data = JSON.parse(lastMessage);
				if (data.type === 'gameState') {
					setGameState(data.payload);
				}
			} catch (error) {
				console.error('Error parsing SSE message:', error);
			}
		}
	}, [messages]);

	// Send authentication message when user logs in
	useEffect(() => {
		if (user && isConnected) {
			sendMessage(
				JSON.stringify({
					type: 'authenticate',
					payload: { userId: user.id },
				})
			);
			console.log('Sent SSE authentication message');
		}
	}, [user, isConnected, sendMessage]);

	// Mutation to create a new room
	const createRoomMutation = useMutation({
		mutationFn: async (roomData: Omit<InsertRoom, 'hostId' | 'code'>) => {
			const res = await apiRequest('POST', '/api/rooms/create', {
				action: 'create',
				...roomData,
				userId: user?.id,
			});
			return await res.json();
		},
		onSuccess: (room: Room) => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			toast({
				title: 'Room created',
				description: `Room code: ${room.code}`,
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to create room',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Mutation to join an existing room
	const joinRoomMutation = useMutation({
		mutationFn: async (roomCode: string) => {
			const res = await apiRequest('POST', '/api/rooms/join', {
				action: 'join',
				roomCode,
				userId: user?.id,
			});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to join room',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Mutation to leave a room
	const leaveRoomMutation = useMutation({
		mutationFn: async () => {
			// if (!gameState?.room?.id) {
			// 	throw new Error('Not in a game room');
			// }

			// const isHost = user?.id === gameState.room.hostId;
			// const nextHost = gameState.players.find(
			// 	(player) => player.userId !== user?.id
			// )?.userId;
			console.log('leave room mutation', gameState)

			const res = await apiRequest('POST', '/api/rooms/leave', {
				action: 'leave',
				roomId: gameState.room.id,
				userId: user?.id,
				// isHost,
				// nextHostId: isHost ? nextHost : undefined,
			});

			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			setGameState(null);
			toast({
				title: 'Left room',
				description: 'You have left the game room',
			});
			router.push('/');
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to leave room',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	const addSongMutation = useMutation({
		mutationFn: async (songData: {
			title: string;
			artist: string;
			albumArt: string;
			genre: string;
			sourceType: string;
			sourceId: string;
			previewUrl: string | null;
		}) => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			console.log('Adding song:', songData);
			const res = await apiRequest('POST', '/api/songs', {
				...songData,
				roomId: gameState.room.id,
			});
			return await res.json();
		},
		onSuccess: (song: Song) => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			toast({
				title: 'Song added',
				description: `"${song.title}" by ${song.artist} has been added to your songs`,
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to add song',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Mutation to start the game
	const startGameMutation = useMutation({
		mutationFn: async () => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			const res = await apiRequest('POST', '/api/rooms', {
				action: 'start',
				roomId: gameState.room.id,
				userId: user?.id,
			});

			if (gameState?.room?.id) {
				console.log('Sending startGame WebSocket message:', {
					roomId: gameState.room.id,
				});
			}

			return await res.json();
		},
		onSuccess: () => {
			// Don't update local state here - it will be updated via WebSocket
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });

			toast({
				title: 'Game starting...',
				description: 'Get ready! The game will begin in 3 seconds.',
				duration: 1000,
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to start game',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Mutation to make a guess
	const makeGuessMutation = useMutation({
		mutationFn: async (guess: string) => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			const data = {
				content: guess,
				roomId: gameState.room.id,
				songId: gameState.currentTrack?.id,
			};

			const res = await apiRequest('POST', '/api/guesses', data);
			return await res.json();
		},
		onSuccess: () => {
			// No toast here as feedback will come through the game state update
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to submit guess',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Mutation to play again after a game ends
	const playAgainMutation = useMutation({
		mutationFn: async () => {
			const res = await apiRequest('POST', '/api/game/play-again', {});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			toast({
				title: 'Starting new game',
				description: 'A new game is being prepared',
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to restart game',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Function to control playback
	const controlPlayback = useCallback(
		(action: 'play' | 'pause') => {
			if (!gameState?.room?.id) {
				console.warn('Not in a game room');
				return;
			}

			const message: GameMessage = {
				type: 'playback',
				payload: {
					roomId: gameState.room.id,
					action,
				} as Record<string, unknown>,
			};

			sendMessage(JSON.stringify(message));
		},
		[gameState?.room?.id, sendMessage]
	);

	// Function to send chat messages
	const sendChatMessage = useCallback(
		(content: string) => {
			if (!gameState?.room?.id || !user?.id) {
				console.warn('Not in a game room or not authenticated');
				return;
			}

			const message: GameMessage = {
				type: 'chat',
				payload: {
					roomId: gameState.room.id,
					userId: user.id,
					content,
				} as Record<string, unknown>,
			};

			sendMessage(JSON.stringify(message));
		},
		[gameState?.room?.id, user?.id, sendMessage]
	);

	// Function to make a guess
	const makeGuess = useCallback(
		(guess: string) => {
			if (!gameState?.room?.id || !user?.id) {
				console.warn('Not in a game room or not authenticated');
				return;
			}

			const message: GameMessage = {
				type: 'guess',
				payload: {
					roomId: gameState.room.id,
					userId: user.id,
					guess,
				} as Record<string, unknown>,
			};

			sendMessage(JSON.stringify(message));
		},
		[gameState?.room?.id, user?.id, sendMessage]
	);

	// Mutation to end the game and delete the room
	const endGameMutation = useMutation({
		mutationFn: async () => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}
			const res = await apiRequest('POST', '/api/game/end', {
				roomId: gameState.room.id,
			});
			return await res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			setGameState(null);
			toast({
				title: 'Game ended',
				description: 'The game has been ended and the room has been deleted',
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to end game',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	// Add this mutation before the return statement
	const deleteSongMutation = useMutation({
		mutationFn: async (songId: number) => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			// Send WebSocket message
			// TODO: Uncomment here and fix with SSE
			// sendMessage({
			// 	type: 'removeSong',
			// 	payload: {
			// 		roomId: gameState.room.id,
			// 		songId,
			// 		userId: user?.id,
			// 	},
			// });

			// Return the songId for success handling
			return { songId };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			toast({
				title: 'Song removed',
				description: 'The song has been removed from your queue',
			});
		},
		onError: (error: Error) => {
			toast({
				title: 'Failed to remove song',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	const value: GameContextType = {
		gameState,
		isLoading,
		error,
		createRoomMutation,
		joinRoomMutation,
		leaveRoomMutation,
		addSongMutation,
		startGameMutation,
		makeGuessMutation,
		playAgainMutation,
		endGameMutation,
		sendChatMessage,
		controlPlayback,
		makeGuess,
		deleteSongMutation,
	};

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error('useGame must be used within a GameProvider');
	}
	return context;
}
