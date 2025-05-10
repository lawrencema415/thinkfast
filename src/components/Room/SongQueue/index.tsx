import { Song } from '@shared/schema';
import { AddSong } from './AddSong';
import { AddedSongs } from './AddedSongs';

interface SongQueueProps {
	songQueue: Song[];
	userId: string;
	roomCode: string;
}

export function SongQueue({
	songQueue,
	userId,
	roomCode,
}: SongQueueProps) {

	const SONG_QUEUE_HEADER = 'Your Songs'

	return (
		<div className='bg-dark rounded-lg shadow-lg overflow-hidden mb-6'>
			<div className='flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700'>
				<h2 className='font-heading text-lg font-semibold'>{SONG_QUEUE_HEADER}</h2>
				<AddSong roomCode={roomCode} songQueue={[]} userId={userId} />
			</div>
			<div>
				<AddedSongs songQueue={songQueue} roomCode={roomCode} userId={userId} />
			</div>
		</div>
	);
}
