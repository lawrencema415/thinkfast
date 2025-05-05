import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';

export default function LeaveRoomButton() {
	const { leaveRoomMutation } = useGame();

	const handleLeaveRoom = () => {
		console.log('Leave Room button clicked');
		leaveRoomMutation.mutate();
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
