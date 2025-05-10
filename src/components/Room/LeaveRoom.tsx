import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/useGame';

interface Props {
	roomCode: string;
}
import { useRouter } from 'next/navigation';

export default function LeaveButton({ roomCode }: Props) {
	const { leaveRoomMutation } = useGame();
	const router = useRouter();

	const handleLeaveRoom = () => {
		leaveRoomMutation.mutate(roomCode);
		router.push('/');
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
