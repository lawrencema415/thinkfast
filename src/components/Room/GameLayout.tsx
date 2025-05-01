import { GameState } from '@/shared/schema';

interface GameLayoutProps {
	gameState: GameState;
	onGuess: (guess: string) => void;
	onPlaybackControl: (action: 'play' | 'pause') => void;
	onStart: () => void;
	onLeave: () => void;
	onSendMessage: (message: string) => void;
}

export function GameLayout(
	{
		// gameState,
		// onGuess,
		// onPlaybackControl,
		// onStart,
		// onLeave,
		// onSendMessage,
	}: GameLayoutProps
) {
	return (
		<div>Game Layout</div>
		// <div className='container mx-auto px-4 py-6 min-h-screen'>
		// 	<div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
		// 		{/* Main game area */}
		// 		<div className='lg:col-span-8 space-y-6'>
		// 			<GameBoard
		// 				gameState={gameState}
		// 				onGuess={onGuess}
		// 				onPlaybackControl={onPlaybackControl}
		// 			/>
		// 			<GameControls
		// 				gameState={gameState}
		// 				onStart={onStart}
		// 				onLeave={onLeave}
		// 			/>
		// 		</div>

		// 		{/* Sidebar */}
		// 		<div className='lg:col-span-4 space-y-6'>
		// 			<PlayerList
		// 				players={gameState.players}
		// 				currentTrack={gameState.currentTrack}
		// 			/>
		// 			<ChatBox
		// 				messages={gameState.messages}
		// 				onSendMessage={onSendMessage}
		// 			/>
		// 		</div>
		// 	</div>
		// </div>
	);
}
