import { Button } from '@/components/ui/button';
import { Room } from '@shared/schema';
import { useGame } from '@/hooks/use-game';
import { useToast } from '@/hooks/use-toast';
import * as Tooltip from '@radix-ui/react-tooltip';

interface RoomInfoProps {
	room: Room;
	hostUserName: string;
	currentRound: number;
	totalRounds: number;
}

export function RoomInfo({
	room,
	hostUserName,
	currentRound,
	totalRounds,
}: RoomInfoProps) {
	const { leaveRoomMutation } = useGame();
	const { toast } = useToast();

	const handleLeaveRoom = () => {
		console.log('leaving room');
		leaveRoomMutation.mutate();
	};

	const handleCopyRoomCode = () => {
		navigator.clipboard.writeText(room.code);
		toast({
			title: 'Copied!',
			description: 'Room code copied to clipboard.',
			variant: 'default',
		});
	};

	return (
		<div className='bg-dark rounded-lg shadow-lg p-4 mb-6'>
			<div className='flex justify-between items-center mb-4'>
				<h2 className='font-heading text-lg font-semibold'>Room Code</h2>
				<Tooltip.Provider delayDuration={100}>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<span
								className='px-3 py-1 bg-primary bg-opacity-20 text-black rounded-full text-sm font-medium cursor-pointer transition-colors duration-150 hover:bg-primary hover:bg-opacity-40 active:scale-95 select-none'
								onClick={handleCopyRoomCode}
								style={{ userSelect: 'none' }}
							>
								{room.code}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Portal>
							<Tooltip.Content
								side='top'
								align='center'
								className='bg-black text-white px-2 py-1 rounded text-xs shadow-lg'
							>
								Click to copy
								<Tooltip.Arrow className='fill-black' />
							</Tooltip.Content>
						</Tooltip.Portal>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
			<div className='space-y-3 text-sm'>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Host:</span>
					<span className='font-medium'>{hostUserName}</span>
				</div>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Round:</span>
					<span className='font-medium'>
						{currentRound}/{totalRounds}
					</span>
				</div>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Songs Per Player:</span>
					<span className='font-medium'>{room.songsPerPlayer}</span>
				</div>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Time Per Song:</span>
					<span className='font-medium'>{room.timePerSong} sec</span>
				</div>
			</div>
			<div className='mt-5'>
				<Button
					variant='destructive'
					className='w-full'
					onClick={handleLeaveRoom}
					disabled={leaveRoomMutation.isPending}
				>
					{leaveRoomMutation.isPending ? 'Leaving...' : 'Leave Room'}
				</Button>
			</div>
		</div>
	);
}
