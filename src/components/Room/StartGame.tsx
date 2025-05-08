import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/useGame';

interface Props {
	roomCode: string;
	disabled?: boolean;
	songsPerPlayer: number;
	timePerSong: number;
}

export default function StartGameButton({
	roomCode,
	songsPerPlayer,
	timePerSong,
	disabled,
}: Props) {
	const { startGameMutation } = useGame();

	const handleLeaveRoom = () => {
		startGameMutation.mutate({ roomCode, songsPerPlayer, timePerSong });
	};

	return (
		<Button
			className='w-full'
			onClick={handleLeaveRoom}
			disabled={startGameMutation.isPending || disabled}
		>
			{startGameMutation.isPending ? 'Starting...' : 'Start'}
		</Button>
	);
}
