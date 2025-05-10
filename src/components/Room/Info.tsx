import { Room, Song } from '@shared/schema';
import { useToast } from '@/hooks/useToast';
import * as Tooltip from '@radix-ui/react-tooltip';
import LeaveButton from './LeaveRoom';
import { SettingsModal } from './SettingsModal';
import StartGameButton from './StartGame';
// import { DummyButton } from './DummyButton';

interface RoomInfoProps {
	room: Room;
	hostUserName: string;
	totalRounds: number;
	songsPerPlayer: number;
	timePerSong: number;
	userId: string;
	hostId: string;
	songs: Song[];
	isPlaying?: boolean;
}

export function RoomInfo({
	room,
	hostUserName,
	totalRounds,
	songsPerPlayer,
	timePerSong,
	userId,
	hostId,
	songs = [],
	isPlaying = false,
}: RoomInfoProps) {
	const { toast } = useToast();
	const { code } = room;

	const handleCopyRoomCode = () => {
		if (room.code) {
			navigator.clipboard.writeText(room.code);
			toast({
				title: 'Copied!',
				description: 'Room code copied to clipboard.',
				variant: 'default',
			});
		}
	};

	const disableStart = !songs.length;

	return (
		<div className='bg-dark rounded-lg shadow-lg p-4 mb-6'>
			<div className='flex justify-between items-center mb-4'>
				<div className='flex items-center gap-2'>
					<h2 className='font-heading text-lg font-semibold'>Room Code</h2>
					{userId === hostId && (
						<SettingsModal
							roomCode={code}
							currentSongsPerPlayer={songsPerPlayer}
							currentTimePerSong={timePerSong}
							isHost={true}
						/>
					)}
				</div>
				<Tooltip.Provider delayDuration={100}>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<span
								className='px-3 py-1 bg-primary bg-opacity-20 text-black rounded-full text-sm font-medium cursor-pointer transition-colors duration-150 hover:bg-primary hover:bg-opacity-40 active:scale-95 select-none'
								onClick={handleCopyRoomCode}
								style={{ userSelect: 'none' }}
							>
								{room.code || 'N/A'}
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
					{isPlaying && (
						<span className='font-medium'>
							{totalRounds}
						</span>
					)}
				</div>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Songs Per Player:</span>
					<span className='font-medium'>{songsPerPlayer || 'N/A'}</span>
				</div>
				<div className='flex justify-between'>
					<span className='text-gray-300'>Time Per Song:</span>
					<span className='font-medium'>
						{timePerSong ? `${timePerSong} sec` : 'N/A'}
					</span>
				</div>
			</div>
			<div className='mt-5 flex space-x-2'>
				<StartGameButton
					roomCode={code}
					disabled={disableStart}
					songsPerPlayer={songsPerPlayer}
					timePerSong={timePerSong}
				/>
				<LeaveButton roomCode={code} />
				{/* <div>
					<DummyButton roomCode={code} />
				</div> */}
			</div>
		</div>
	);
}
