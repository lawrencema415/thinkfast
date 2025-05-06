import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';

interface Props {
	roomCode: string;
}

export default function LeaveRoomButton({ roomCode }: Props) {
	const { leaveRoomMutation } = useGame();

	// TODO: FIX handleLeaveRoom/route
	const handleLeaveRoom = () => {
		console.log('Leave Room button clicked');
		leaveRoomMutation.mutate(roomCode);
	};

	return (
		<Button
			variant='secondary'
			className='w-full'
			onClick={handleLeaveRoom}
			disabled={leaveRoomMutation.isPending}
		>
			{leaveRoomMutation.isPending ? 'Leaving...' : 'Leave Room'}
		</Button>
	);
}
