import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Player, Song } from '@shared/schema';
import { Music2, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import ReactPlayer from 'react-player';
import Image from 'next/image';

interface MusicPlayerProps {
	currentTrack: Song | null;
	submitter: Player | null;
	currentRound: number;
	totalRounds: number;
	isPlaying: boolean;
	timeRemaining: number;
	onPlayPause: () => void;
}

// FIXME: Update according to schema
export function MusicPlayer({
	currentTrack,
	submitter,
	currentRound,
	totalRounds,
	isPlaying,
	timeRemaining,
}: MusicPlayerProps) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const playerRef = useRef<ReactPlayer>(null);
	const [volume, setVolume] = useState(() => {
		// Get volume from localStorage or default to 0.6 (60%)
		const savedVolume = localStorage.getItem('musicPlayerVolume');
		return savedVolume ? parseFloat(savedVolume) : 0.6;
	});
	const [isMuted, setIsMuted] = useState(() => {
		// Get mute state from localStorage or default to false
		const savedMute = localStorage.getItem('musicPlayerMuted');
		return savedMute ? JSON.parse(savedMute) : false;
	});

	// Add ref to store the original volume
	const originalVolumeRef = useRef(volume);

	// Track the last played track to prevent resetting
	const lastTrackRef = useRef<Song | null>(null);
	const isPlayingRef = useRef(false);
	// Add refs for storing revealed positions
	const titleRevealedPositionsRef = useRef<number[]>([]);
	const artistRevealedPositionsRef = useRef<number[]>([]);
	const lastTitleLengthRef = useRef<number>(0);
	const lastArtistLengthRef = useRef<number>(0);

	// // Create audio element only once
	// useEffect(() => {
	// 	audioRef.current = new Audio();
	// 	return () => {
	// 		if (audioRef.current) {
	// 			audioRef.current.pause();
	// 			audioRef.current.removeEventListener('loadedmetadata', () => {});
	// 			audioRef.current = null;
	// 		}
	// 	};
	// }, []);

	useEffect(() => {
		if (currentTrack && currentTrack.previewUrl && isPlaying) {
			// Initialize audio element if it doesn't exist
			if (!audioRef.current) {
				audioRef.current = new Audio();
			}

			// Only set source and load if it's a new track
			if (lastTrackRef.current?.id !== currentTrack.id) {
				audioRef.current.src = currentTrack.previewUrl;
				audioRef.current.load();

				// Start playback when loaded
				audioRef.current.addEventListener(
					'canplaythrough',
					() => {
						if (audioRef.current) {
							audioRef.current.play().catch((error) => {
								console.error('Error playing preview:', error);
							});
							isPlayingRef.current = true;
						}
					},
					{ once: true }
				);

				// Update last track reference
				lastTrackRef.current = currentTrack;
			} else if (!isPlayingRef.current) {
				// If it's the same track and not playing, start playback
				audioRef.current.play().catch((error) => {
					console.error('Error playing preview:', error);
				});
				isPlayingRef.current = true;
			}
		} else if (audioRef.current) {
			// Stop playback if game is not playing
			audioRef.current.pause();
			isPlayingRef.current = false;
		}

		// Cleanup function to stop playback when track changes or component unmounts
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				isPlayingRef.current = false;
			}
			// Safely handle YouTube player cleanup
			try {
				if (playerRef.current?.getInternalPlayer()) {
					// eslint-disable-next-line react-hooks/exhaustive-deps
					const player = playerRef.current.getInternalPlayer();
					if (player && typeof player.pauseVideo === 'function') {
						player.pauseVideo();
					}
				}
			} catch (error) {
				console.error('Error cleaning up YouTube player:', error);
			}
		};
	}, [currentTrack, isPlaying]);

	// Calculate hint display
	const generateHint = (
		text: string,
		timeElapsed: number,
		isTitle: boolean
	) => {
		const totalLength = text.length;
		const positionsRef = isTitle
			? titleRevealedPositionsRef
			: artistRevealedPositionsRef;
		const lastLengthRef = isTitle ? lastTitleLengthRef : lastArtistLengthRef;

		// Reset positions if text length changed (new song)
		if (lastLengthRef.current !== totalLength) {
			positionsRef.current = [];
			lastLengthRef.current = totalLength;
		}

		// Show all letters in the last second
		if (timeElapsed >= 29) {
			return text.split('').join(' ');
		}

		// No hints for the first 5 seconds
		if (timeElapsed <= 5) {
			positionsRef.current = [];
			return '_'.repeat(totalLength).split('').join(' ');
		}

		// Gradually reveal up to 25% of letters between seconds 5-29
		const maxRevealPercentage = 0.25; // 25%
		const progressPercentage = (timeElapsed - 5) / 24; // Progress from 0 to 1 between seconds 5-29
		const revealPercentage = progressPercentage * maxRevealPercentage;
		const targetRevealCount = Math.floor(totalLength * revealPercentage);

		// Add new positions if needed
		while (positionsRef.current.length < targetRevealCount) {
			let newPos;
			do {
				newPos = Math.floor(Math.random() * totalLength);
			} while (positionsRef.current.includes(newPos));
			positionsRef.current.push(newPos);
		}

		// Build the hint string with revealed letters and underscores
		const chars = text.split('');
		const hint = chars
			.map((char, i) => (positionsRef.current.includes(i) ? char : '_'))
			.join(' ');
		return hint;
	};

	const titleHint = currentTrack
		? generateHint(currentTrack.title, 30 - timeRemaining, true)
		: '______';

	const artistHint = currentTrack
		? generateHint(currentTrack.artist, 30 - timeRemaining, false)
		: '______';

	// Handle volume fade-out effect
	useEffect(() => {
		if (timeRemaining <= 3 && timeRemaining > 0) {
			// Calculate new volume based on time remaining (3 seconds to 0)
			const newVolume = (timeRemaining / 3) * originalVolumeRef.current;
			setVolume(newVolume);

			// Update audio volume
			if (audioRef.current) {
				audioRef.current.volume = newVolume;
			}
			if (playerRef.current) {
				playerRef.current.getInternalPlayer()?.setVolume(newVolume * 100);
			}
		} else if (timeRemaining === 0) {
			// Reset volume to original when time is up
			setVolume(originalVolumeRef.current);
			if (audioRef.current) {
				audioRef.current.volume = originalVolumeRef.current;
			}
			if (playerRef.current) {
				playerRef.current
					.getInternalPlayer()
					?.setVolume(originalVolumeRef.current * 100);
			}
		}
	}, [timeRemaining]);

	// Handle volume changes
	const handleVolumeChange = (value: number[]) => {
		const newVolume = value[0];
		setVolume(newVolume);
		localStorage.setItem('musicPlayerVolume', newVolume.toString());

		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
		if (playerRef.current) {
			playerRef.current.getInternalPlayer()?.setVolume(newVolume * 100);
		}
	};

	// Handle mute toggle
	const toggleMute = () => {
		const newMutedState = !isMuted;
		setIsMuted(newMutedState);
		localStorage.setItem('musicPlayerMuted', JSON.stringify(newMutedState));

		if (audioRef.current) {
			audioRef.current.muted = newMutedState;
		}
		if (playerRef.current) {
			playerRef.current
				.getInternalPlayer()
				?.setVolume(newMutedState ? 0 : volume * 100);
		}
	};

	// Initialize volume and mute state on component mount
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
			audioRef.current.muted = isMuted;
		}
		if (playerRef.current) {
			playerRef.current
				.getInternalPlayer()
				?.setVolume(isMuted ? 0 : volume * 100);
		}
	}, [isMuted, volume]);

	if (!currentTrack) {
		return (
			<div className='bg-gray-800 rounded-lg p-6 text-center mb-5'>
				<Music2 className='h-12 w-12 mx-auto mb-4 text-gray-400' />
				<p className='text-gray-300'>Waiting for game to start...</p>
			</div>
		);
	}

	return (
		<div className='bg-gray-800 rounded-lg p-6 mb-6'>
			<div className='text-center mb-6'>
				<h2 className='text-xl font-heading font-bold mb-2'>
					Song {currentRound} of {totalRounds} playing
				</h2>
				<p className='text-gray-400'>Guess the song</p>
			</div>

			<div className='flex flex-col items-center mb-6'>
				{currentTrack.albumArt && (
					<div className='relative w-48 h-48 mb-4'>
						<Image
							src={currentTrack.albumArt}
							alt='Track artwork'
							className='w-full h-full rounded-lg object-cover transition-all duration-300'
							style={{
								filter:
									timeRemaining > 1
										? `blur(${(timeRemaining / 30) * 40}px) brightness(${
												0.4 + ((30 - timeRemaining) / 30) * 0.6
										  }) contrast(${0.3 + ((30 - timeRemaining) / 30) * 0.7})`
										: 'none',
							}}
						/>
					</div>
				)}
				<div className='text-lg font-mono mb-4'>
					<p className='mb-2'>Hint: {titleHint}</p>
					<p>Artist: {artistHint}</p>
				</div>
				<Progress value={(timeRemaining / 30) * 100} className='w-full mb-2' />
				<p className='text-sm text-gray-400'>
					{timeRemaining} seconds remaining
				</p>

				{/* Volume Controls */}
				<div className='flex items-center gap-2 w-full mt-4'>
					<Button
						variant='ghost'
						size='icon'
						onClick={toggleMute}
						className='text-gray-400 hover:text-white'
					>
						{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
					</Button>
					<Slider
						value={[volume]}
						onValueChange={handleVolumeChange}
						max={1}
						step={0.1}
						className='w-full'
					/>
				</div>
			</div>

			{submitter && (
				<p className='text-center text-sm text-gray-400'>
					Song submitted by {submitter.user.user_metadata.display_name}
				</p>
			)}

			{/* Hidden player for actual song playback */}
			{/* {currentTrack && (
				<div style={{ display: 'none' }}>
					<ReactPlayer
						ref={playerRef}
						url={`https://www.youtube.com/watch?v=${currentTrack.sourceId}`}
						playing={isPlaying}
						width='0%'
						height='0%'
						config={{
							youtube: {
								playerVars: {
									start: 30, // Start at 30 seconds
									end: 40, // Play for 10 seconds
									controls: 0,
									disablekb: 1,
									fs: 0,
									modestbranding: 1,
								},
							},
						}}
					/>
				</div>
			)} */}
		</div>
	);
}
