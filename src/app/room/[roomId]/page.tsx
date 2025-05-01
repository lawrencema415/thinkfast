'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

export default function RoomPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const { toast } = useToast();

	useEffect(() => {
		const fetchGameState = async () => {
			try {
				const response = await axios.get(`/api/game/state?roomId=${roomId}`);
				console.log('Game State:', response.data);
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
	}, [roomId, toast]);

	return (
		<>
			<div>Room page {roomId}</div>
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
