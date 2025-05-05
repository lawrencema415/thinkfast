'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import LeaveRoomButton from '@/components/leave-room';
import { useSSE } from '@/hooks/useSSE'; // Import the useSSE hook
import { GameState } from '@/shared/schema';

export default function RoomPage() {
	const [initialState, setInitialState] = useState<GameState | null>(null);
	const params = useParams();
	const roomCode = params.roomCode as string;
	const { toast } = useToast();
	const { gameState } = useSSE(roomCode);

	useEffect(() => {
		if (gameState) {
			setInitialState(gameState); // Update the state when the gameState changes
		}
	}, [gameState]);

	useEffect(() => {
		const fetchGameState = async () => {
			try {
				const response = await axios.get(
					`/api/game/state?roomCode=${roomCode}`
				);
				setInitialState(response.data.gameState);
			} catch (error) {
				console.error('Error fetching game state:', error);
				toast({
					title: 'Error',
					description: 'Failed to fetch game state',
					variant: 'destructive',
				});
			}
		};

		fetchGameState();
	}, [roomCode, toast]);

	return (
		<>
			<div>Room page {roomCode}</div>
			<div className='w-48 mt-4'>
				<LeaveRoomButton />
			</div>
			{/* Use the gameState from SSE */}
			{initialState && (
				<div>
					<p>Current Round: {initialState.currentRound}</p>
					<p>Total Rounds: {initialState.totalRounds}</p>
					<p>Is Playing: {initialState.isPlaying ? 'Yes' : 'No'}</p>
				</div>
			)}
			{/* <CountdownOverlay countdown={gameState.countdown?.isActive ? gameState.countdown.remaining : null} />
			<PrivateHintToast hint={gameState.privateHint} />
			
			<GameLayout
				gameState={gameState}
				onGuess={makeGuess}
				onPlaybackControl={controlPlayback}
				onStart={startGameMutation.mutate}
				onLeave={leaveRoomMutation.mutate}
				onSendMessage={sendChatMessage}
			/> */}
		</>
	);
}
