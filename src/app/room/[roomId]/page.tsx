'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGame } from '@/hooks/use-game';
import { useToast } from '@/hooks/use-toast';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';
// import { CountdownOverlay } from '@/components/room/CountdownOverlay';
// import { PrivateHintToast } from '@/components/room/PrivateHintToast';
// import { GameLayout } from '@/components/room/GameLayout';
import { RoomNotFound } from '@/components/Room/RoomNotFound';

export default function RoomPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const { toast } = useToast();
	const {
		gameState,
		isLoading,
		error,
		// leaveRoomMutation,
		// startGameMutation,
		// makeGuess,
		// sendChatMessage,
		// controlPlayback,
	} = useGame();

	useEffect(() => {
		if (error) {
			toast({
				title: 'Error',
				description: error.message,
				variant: 'destructive',
			});
		}
	}, [error, toast]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				loading...
			</div>
		);
	}

	if (!gameState) {
		return <RoomNotFound />;
	}

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
