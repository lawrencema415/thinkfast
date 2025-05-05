import React from 'react';

export default function AddSongs() {
	return <div>AddSongs</div>;
}

// import { Button } from '@/components/ui/button';
// import { Trash2 } from 'lucide-react';
// import { Song } from '@shared/schema';
// import { useGame } from '@/hooks/use-game';
// import Image from 'next/image';

// interface AddSongsProps {
// 	userSongs: Song[];
// 	onAddSong: () => void;
// 	onEditSong: (song: Song) => void;
// 	onDeleteSong: (songId: number) => void;
// }

// export function AddSongs({
// 	userSongs,
// 	onAddSong,
// 	onDeleteSong,
// }: AddSongsProps) {
// 	const { gameState } = useGame();

// 	const songsLeft = gameState?.room?.songsPerPlayer
// 		? gameState.room.songsPerPlayer - userSongs.length
// 		: 0;

// 	return (
// 		<div className='bg-dark rounded-lg shadow-lg overflow-hidden'>
// 			<div className='p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center'>
// 				<h2 className='font-heading text-lg font-semibold'>Your Songs</h2>
// 				<Button
// 					variant='ghost'
// 					size='sm'
// 					onClick={onAddSong}
// 					disabled={songsLeft <= 0}
// 				>
// 					<PlusIcon className='h-4 w-4 mr-1' /> Add
// 				</Button>
// 			</div>

// 			<div className='p-4 space-y-3'>
// 				{userSongs.map((song) => (
// 					<div
// 						key={song.id}
// 						className='p-3 rounded-lg bg-surface bg-opacity-50 hover:bg-opacity-70 transition-colors'
// 					>
// 						<div className='flex items-center'>
// 							<Image
// 								src={
// 									song.albumArt ||
// 									'https://via.placeholder.com/50x50?text=No+Cover'
// 								}
// 								alt='Album cover'
// 								className='w-10 h-10 rounded mr-3'
// 							/>
// 							<div className='flex-1'>
// 								<h3 className='font-medium text-sm'>{song.title}</h3>
// 								<p className='text-xs text-gray-400'>{song.artist}</p>
// 							</div>
// 							<div className='flex space-x-1'>
// 								{/* <Button
// 									variant='ghost'
// 									size='icon'
// 									className='h-8 w-8 text-gray-400 hover:text-white'
// 									onClick={() => onEditSong(song)}
// 								>
// 									<Pencil className='h-4 w-4' />
// 								</Button> */}
// 								<Button
// 									variant='ghost'
// 									size='icon'
// 									className='h-8 w-8 text-gray-400 hover:text-error'
// 									onClick={() => onDeleteSong(song.id)}
// 								>
// 									<Trash2 className='h-4 w-4' />
// 								</Button>
// 							</div>
// 						</div>
// 					</div>
// 				))}

// 				{userSongs.length === 0 && (
// 					<div className='text-center py-4 text-gray-400'>
// 						No songs added yet. Add {songsLeft} song{songsLeft !== 1 ? 's' : ''}{' '}
// 						to start playing!
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }

// function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
// 	return (
// 		<svg
// 			{...props}
// 			xmlns='http://www.w3.org/2000/svg'
// 			width='24'
// 			height='24'
// 			viewBox='0 0 24 24'
// 			fill='none'
// 			stroke='currentColor'
// 			strokeWidth='2'
// 			strokeLinecap='round'
// 			strokeLinejoin='round'
// 		>
// 			<path d='M5 12h14' />
// 			<path d='M12 5v14' />
// 		</svg>
// 	);
// }
