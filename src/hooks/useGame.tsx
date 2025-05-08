'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { GameState, Room, Song } from '../shared/schema';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type GameContextType = {
	isLoading: boolean;
	error: Error | null;
	createRoomMutation: UseMutationResult<
		GameState,
		Error,
		{ songsPerPlayer: number; timePerSong: number }
	>;
	joinRoomMutation: UseMutationResult<Room, Error, string>;
	leaveRoomMutation: UseMutationResult<void, Error, string>;
	addSongMutation: UseMutationResult<
		Song,
		Error,
		{ roomCode: string; song: Song }
	>;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
	const { toast } = useToast();
	const { user } = useAuth();
	const router = useRouter();

	// Mutation to create a new room
	const createRoomMutation = useMutation<
		GameState,
		Error,
		{ songsPerPlayer: number; timePerSong: number }
	>({
		mutationFn: async ({ songsPerPlayer, timePerSong }) => {
			const res = await apiRequest('POST', '/api/rooms/create', {
				action: 'create',
				songsPerPlayer,
				timePerSong,
				userId: user?.id,
			});
			return await res.json();
		},
		onSuccess: (gameState: GameState) => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
			toast({
				title: 'Room created',
				description: `Room code: ${gameState.room.code}`,
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
		mutationFn: async (roomCode: string) => {
			const res = await apiRequest('POST', '/api/rooms/leave', {
				roomCode,
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Failed to leave room');
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
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

	const addSongMutation = useMutation<
		Song,
		Error,
		{ roomCode: string; song: Song }
	>({
		mutationFn: async ({ roomCode, song }) => {
			const res = await apiRequest('POST', '/api/songs/add', {
				roomCode,
				song,
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.message || 'Failed to add song');
			}

			return song;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
		},
	});

	const value: GameContextType = {
		isLoading:
			createRoomMutation.status === 'pending' ||
			joinRoomMutation.status === 'pending' ||
			leaveRoomMutation.status === 'pending' ||
			addSongMutation.status === 'pending',
		error:
			createRoomMutation.error ||
			joinRoomMutation.error ||
			leaveRoomMutation.error ||
			addSongMutation.error,
		createRoomMutation,
		joinRoomMutation,
		leaveRoomMutation,
		addSongMutation,
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
