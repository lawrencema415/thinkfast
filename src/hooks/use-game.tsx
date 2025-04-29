'use client';

import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
	useCallback,
} from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useWebSocket, useWebSocketListener } from '@/lib/websocket';
import {
	InsertRoom,
	InsertSong,
	GameState,
	Song,
	Room,
	PlayerWithUser,
	InsertGuess,
} from '@shared/schema';
import { useRouter } from 'next/navigation';

type GameContextType = {
	gameState: GameState | null;
	isLoading: boolean;
	error: Error | null;
	createRoomMutation: any;
	joinRoomMutation: any;
	leaveRoomMutation: any;
	addSongMutation: any;
	startGameMutation: any;
	makeGuessMutation: any;
	playAgainMutation: any;
	endGameMutation: any;
	sendChatMessage: (message: string) => void;
	controlPlayback: (action: 'play' | 'pause') => void;
	makeGuessViaWebSocket: (guess: string) => void;
	deleteSongMutation: any;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
	const { toast } = useToast();
	const { user } = useAuth();
	const { sendMessage, connected } = useWebSocket();
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

	// Listen for game state updates via WebSocket
	useWebSocketListener('gameState', (payload: GameState) => {
		setGameState(payload);
	});

	// Send authentication message when user logs in or WebSocket reconnects
	useEffect(() => {
		if (user && connected) {
			// Send authentication to WebSocket server
			sendMessage({
				type: 'authenticate',
				payload: { userId: user.id },
			});
			console.log('Sent WebSocket authentication message');
		}
	}, [user, connected, sendMessage]);

	// Mutation to create a new room
	const createRoomMutation = useMutation({
		mutationFn: async (roomData: Omit<InsertRoom, 'hostId' | 'code'>) => {
			const res = await apiRequest('POST', '/api/rooms', roomData);
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
			// Send WebSocket message
			sendMessage({
				type: 'joinRoom',
				payload: {
					roomId: roomCode,
				},
			});
			// Return the roomCode to maintain consistency with mutation type
			return { roomCode };
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
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			const isHost = user?.id === gameState.room.hostId;
			const nextHost = gameState.players.find(
				(p) => p.userId !== user?.id
			)?.userId;

			const res = await apiRequest('POST', '/api/rooms/leave', {
				roomId: gameState.room.id,
				isHost,
				nextHostId: isHost ? nextHost : undefined,
			});

			// Send WebSocket message to notify other players
			sendMessage({
				type: 'leaveRoom',
				payload: {
					roomId: gameState.room.id,
					userId: user?.id,
				},
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

	// Mutation to add a song to the room
	// const addSongMutation = useMutation({
	// 	mutationFn: async (songData: Omit<InsertSong, 'roomId' | 'userId'>) => {
	// 		const res = await apiRequest('POST', '/api/songs', songData);
	// 		return await res.json();
	// 	},
	// 	onSuccess: (song: Song) => {
	// 		queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
	// 		toast({
	// 			title: 'Song added',
	// 			description: `"${song.title}" by ${song.artist} has been added to your songs`,
	// 		});
	// 	},
	// 	onError: (error: Error) => {
	// 		toast({
	// 			title: 'Failed to add song',
	// 			description: error.message,
	// 			variant: 'destructive',
	// 		});
	// 	},
	// });

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
			// Send WebSocket message
			sendMessage({
				type: 'addSong',
				payload: {
					roomId: gameState.room.id,
					song: songData,
				},
			});

			// const res = await apiRequest('POST', '/api/songs', songData);
			// return await res.json();
			return songData;
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
			const res = await apiRequest('POST', '/api/game/start', {});

			if (gameState?.room?.id) {
				console.log('Sending startGame WebSocket message:', {
					roomId: gameState.room.id,
				});
				sendMessage({
					type: 'startGame',
					payload: {
						roomId: gameState.room.id,
					},
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
		mutationFn: async (
			guessData: Omit<InsertGuess, 'roomId' | 'userId' | 'songId'>
		) => {
			if (!gameState?.room?.id) {
				throw new Error('Not in a game room');
			}

			const data = {
				...guessData,
				roomId: gameState.room.id,
				songId: gameState.currentTrack?.id,
			};

			const res = await apiRequest('POST', '/api/guesses', data);
			return await res.json();
		},
		onSuccess: (result) => {
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

	// Function to send a chat message via WebSocket
	const sendChatMessage = useCallback(
		(message: string) => {
			if (!gameState?.room?.id) {
				toast({
					title: 'Cannot send message',
					description: 'You are not in a game room',
					variant: 'destructive',
				});
				return;
			}

			sendMessage({
				type: 'chat',
				payload: {
					roomId: gameState.room.id,
					content: message,
					type: 'chat',
				},
			});
		},
		[gameState?.room?.id, sendMessage, toast]
	);

	// Function to control game playback (play/pause)
	const controlPlayback = useCallback(
		(action: 'play' | 'pause') => {
			if (!gameState?.room?.id) {
				toast({
					title: 'Cannot control playback',
					description: 'You are not in a game room',
					variant: 'destructive',
				});
				return;
			}

			sendMessage({
				type: 'playback',
				payload: {
					roomId: gameState.room.id,
					action,
				},
			});
		},
		[gameState?.room?.id, sendMessage, toast]
	);

	// Function to submit a guess via WebSocket instead of HTTP
	const makeGuessViaWebSocket = useCallback(
		(guess: string) => {
			if (!gameState?.room?.id || !gameState.currentTrack?.id) {
				toast({
					title: 'Cannot make guess',
					description: 'No active song is playing',
					variant: 'destructive',
				});
				return;
			}

			sendMessage({
				type: 'guess',
				payload: {
					roomId: gameState.room.id,
					songId: gameState.currentTrack.id,
					content: guess,
				},
			});
		},
		[gameState?.room?.id, gameState?.currentTrack?.id, sendMessage, toast]
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
			sendMessage({
				type: 'removeSong',
				payload: {
					roomId: gameState.room.id,
					songId,
					userId: user?.id,
				},
			});

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

	// Add deleteSongMutation to the context value
	return (
		<GameContext.Provider
			value={{
				gameState,
				isLoading,
				error,
				createRoomMutation,
				joinRoomMutation,
				leaveRoomMutation,
				addSongMutation,
				deleteSongMutation, // Add this line
				startGameMutation,
				makeGuessMutation,
				playAgainMutation,
				endGameMutation, // Add this line
				sendChatMessage,
				controlPlayback,
				makeGuessViaWebSocket,
			}}
		>
			{children}
		</GameContext.Provider>
	);
}

export function useGame() {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error('useGame must be used within a GameProvider');
	}
	return context;
}
