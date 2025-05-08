import { useState, useRef } from 'react';
import { Song } from '@shared/schema';
import { MusicWave } from '@/components/ui/music-wave';
import { useToast } from '@/hooks/useToast';
import ReactPlayer from 'react-player';
import { AddSong } from './AddSong';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { AddedSongs } from './AddedSongs';

interface SongQueueProps {
	songQueue: Song[];
	currentTrackIndex: number;
	userId: string;
	roomCode: string;
}

export function SongQueue({
	songQueue,
	currentTrackIndex,
	userId,
	roomCode,
}: SongQueueProps) {
	const { toast } = useToast();
	const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isRemoving, setIsRemoving] = useState<string | null>(null);
	const playerRef = useRef<ReactPlayer>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	// Filter songs to only show those added by the current user
	const userSongs = songQueue.filter((song) => song.userId === userId);

	const handleRemoveSong = async (songId: string) => {
		try {
			setIsRemoving(songId);
			await axios.post('/api/songs/remove', {
				roomCode,
				songId,
			});
			toast({
				title: 'Song removed',
				description: 'The song has been removed from the queue',
			});
		} catch (error) {
			console.error('Failed to remove song:', error);
			toast({
				title: 'Error',
				description: 'Failed to remove song from the queue',
				variant: 'destructive',
			});
		} finally {
			setIsRemoving(null);
		}
	};

	return (
		<div className='bg-dark rounded-lg shadow-lg overflow-hidden mb-6'>
			<div className='flex justify-between p-4 bg-gray-800 border-b border-gray-700'>
				<h2 className='font-heading text-lg font-semibold'>Song Queue</h2>
				<AddSong roomCode={roomCode} songQueue={[]} userId={userId} />
			</div>
			<div>
				<AddedSongs songQueue={songQueue} roomCode={roomCode} userId={userId} />
			</div>

			<div className='p-4 space-y-3'>
				{songQueue.map((song, index) => {
					const isCurrent = index === currentTrackIndex;
					const isUserSong = song.userId === userId;
					const displayNumber = index + 1;

					// Skip songs not added by the user
					if (!isUserSong) return null;

					return (
						<div
							key={song.id}
							className={`flex items-center p-3 rounded-lg transition-colors ${
								isCurrent
									? 'bg-primary bg-opacity-10 border border-primary/30 relative'
									: 'bg-surface bg-opacity-50 hover:bg-opacity-70'
							}`}
						>
							{isCurrent && (
								<div className='absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-primary rounded-r-lg'></div>
							)}
							<div
								className={`w-8 h-8 flex items-center justify-center ${
									isCurrent ? 'bg-primary/20' : 'bg-gray-700'
								} rounded-full mr-3`}
							>
								<span
									className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}
								>
									{displayNumber}
								</span>
							</div>

							<div className='flex-1 flex items-center'>
								{song.albumArt && (
									<Image
										src={song.albumArt}
										alt={song.title}
										className='w-10 h-10 rounded mr-3'
										height={40}
										width={40}
									/>
								)}
								<div className='flex-1'>
									<h3 className='font-medium text-sm'>{song.title}</h3>
									<p className='text-xs text-gray-400'>{song.artist}</p>
								</div>

								<div className='flex items-center space-x-2'>
									{isCurrent ? (
										<MusicWave size='sm' />
									) : (
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8 text-gray-400 hover:text-error'
											onClick={() => handleRemoveSong(song.id)}
											disabled={isRemoving === song.id}
										>
											<Trash2 className='h-4 w-4' />
										</Button>
									)}
								</div>
							</div>
						</div>
					);
				})}

				{userSongs.length === 0 && (
					<div className='text-center py-4 text-gray-400'>
						No songs in queue. Add songs to get started!
					</div>
				)}
			</div>

			{/* Hidden audio element for Spotify previews */}
			<audio ref={audioRef} className='hidden' />

			{/* Hidden player for YouTube previews */}
			{previewingSongId &&
				isPlaying &&
				songQueue.find((s) => s.userId === previewingSongId)?.sourceType ===
					'youtube' && (
					<div style={{ display: 'none' }}>
						<ReactPlayer
							ref={playerRef}
							url={`https://youtu.be/gbxxpSNE5o4`}
							playing={isPlaying}
							onReady={() => {
								toast({
									title: 'Preview ready',
									description: 'Now playing a preview of this song',
								});
							}}
							onEnded={() => {
								setIsPlaying(false);
								setPreviewingSongId(null);
							}}
							onError={() => {
								toast({
									title: 'Preview error',
									description: 'Could not load preview. Try again later.',
									variant: 'destructive',
								});
								setIsPlaying(false);
								setPreviewingSongId(null);
							}}
							width='0%'
							height='0%'
							config={{
								youtube: {
									playerVars: {
										start: 30,
										end: 45,
										autoplay: 1,
									},
								},
							}}
						/>
					</div>
				)}
		</div>
	);
}
