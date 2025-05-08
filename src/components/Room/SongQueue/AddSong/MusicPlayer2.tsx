import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface MusicPlayerProps {
	previewUrl: string;
	thumbnailUrl: string;
	title?: string;
	artist?: string;
}

// Example musicplayer, will remove later
export default function MusicPlayer({
	previewUrl = 'https://p.scdn.co/mp3-preview/09b948677c9072697be316b8cf6111fbf9509b1e',
	thumbnailUrl,
	title = 'Untitled Track',
	artist = 'Unknown Artist',
}: MusicPlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(1);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		// When metadata is loaded (duration available)
		const onLoadedMetadata = () => {
			setDuration(audio.duration);
		};

		// Update current time as audio plays
		const onTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
		};

		// When audio ends
		const onEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
			audio.currentTime = 0;
		};

		audio.addEventListener('loadedmetadata', onLoadedMetadata);
		audio.addEventListener('timeupdate', onTimeUpdate);
		audio.addEventListener('ended', onEnded);

		return () => {
			audio.removeEventListener('loadedmetadata', onLoadedMetadata);
			audio.removeEventListener('timeupdate', onTimeUpdate);
			audio.removeEventListener('ended', onEnded);
		};
	}, []);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;

		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
		}
		setIsPlaying(!isPlaying);
	};

	const toggleMute = () => {
		const audio = audioRef.current;
		if (!audio) return;

		const newMuteState = !isMuted;
		audio.muted = newMuteState;
		setIsMuted(newMuteState);
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const audio = audioRef.current;
		if (!audio) return;

		const newVolume = Number.parseFloat(e.target.value);
		audio.volume = newVolume;
		setVolume(newVolume);
		setIsMuted(newVolume === 0);
	};

	const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const progressBar = progressRef.current;
		const audio = audioRef.current;
		if (!progressBar || !audio) return;

		const rect = progressBar.getBoundingClientRect();
		const clickPosition = (e.clientX - rect.left) / rect.width;
		const newTime = clickPosition * duration;

		audio.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const formatTime = (time: number) => {
		if (isNaN(time) || time <= 0) return '0:00';
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};

	return (
		<div className='flex items-center w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden'>
			<div className='h-16 w-16 flex-shrink-0'>
				<Image
					src={thumbnailUrl || '/placeholder.svg'}
					alt={`${title} cover`}
					className='h-full w-full object-cover'
					width={40}
					height={40}
				/>
			</div>

			<div className='flex-1 px-4 py-2'>
				<div className='flex justify-between items-start'>
					<div className='flex-1'>
						<h3 className='font-medium text-gray-900 truncate'>{title}</h3>
						<p className='text-sm text-gray-500 truncate'>{artist}</p>
					</div>
					<button
						className='text-gray-500 hover:text-gray-700 p-1'
						aria-label='More options'
					>
						<MoreVertical size={18} />
					</button>
				</div>

				<div className='mt-1 flex items-center gap-2'>
					<button
						onClick={togglePlay}
						className='flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full'
						aria-label={isPlaying ? 'Pause' : 'Play'}
					>
						{isPlaying ? (
							<Pause size={16} />
						) : (
							<Play size={16} className='ml-0.5' />
						)}
					</button>

					<span className='text-xs text-gray-500 w-16'>
						{formatTime(currentTime)} /{' '}
						{duration ? formatTime(duration) : '00:00'}
					</span>

					<div
						ref={progressRef}
						className='flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer'
						onClick={handleProgressClick}
					>
						<div
							className='h-full bg-blue-500 rounded-full'
							style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
						/>
					</div>

					<div className='flex items-center gap-1'>
						<button
							onClick={toggleMute}
							className='text-gray-500 hover:text-gray-700'
							aria-label={isMuted ? 'Unmute' : 'Mute'}
						>
							{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
						</button>

						<input
							type='range'
							min='0'
							max='1'
							step='0.01'
							value={volume}
							onChange={handleVolumeChange}
							className='w-12 h-1 accent-blue-500'
							aria-label='Volume'
						/>
					</div>
				</div>
			</div>

			<audio ref={audioRef} src={previewUrl} preload='metadata' />
		</div>
	);
}
