import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

export function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0');
	const s = Math.floor(seconds % 60)
		.toString()
		.padStart(2, '0');
	return `${m}:${s}`;
}

interface MusicPlayerProps {
	audioRef: React.RefObject<HTMLAudioElement | null>;
	previewUrl: string;
	thumbnailUrl: string;
	title: string;
	artist: string;
	customTitle: string;
	setCustomTitle: (title: string) => void;
}

export default function MusicPlayer({
	audioRef,
	previewUrl,
	thumbnailUrl,
	title,
	artist,
	customTitle,
	setCustomTitle,
}: MusicPlayerProps) {
	const progressRef = useRef<HTMLDivElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(30);
	const [volume, setVolume] = useState(0.5);
	const [isMuted, setIsMuted] = useState(false);

	// When previewUrl changes, reset audio and state
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.pause();
		audio.src = previewUrl || '';
		audio.load();
		setCurrentTime(0);
		setIsPlaying(false);

		if (previewUrl && audioRef.current) {
			audioRef.current.src = previewUrl;
			audioRef.current.currentTime = 0;
			audioRef.current.play();
			setIsPlaying(true);
		}
	}, [previewUrl, audioRef]);

	// Sync volume and mute
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.volume = volume;
		audio.muted = isMuted;
	}, [volume, isMuted, audioRef]);

	// Listen for time updates and play/pause events
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => setCurrentTime(audio.currentTime);
		const updateDuration = () => setDuration(audio.duration || 30);
		const handlePlay = () => setIsPlaying(true);
		const handlePause = () => setIsPlaying(false);

		audio.addEventListener('timeupdate', updateTime);
		audio.addEventListener('loadedmetadata', updateDuration);
		audio.addEventListener('play', handlePlay);
		audio.addEventListener('pause', handlePause);

		return () => {
			audio.removeEventListener('timeupdate', updateTime);
			audio.removeEventListener('loadedmetadata', updateDuration);
			audio.removeEventListener('play', handlePlay);
			audio.removeEventListener('pause', handlePause);
		};
	}, [audioRef]);

	const togglePlay = async () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) {
			try {
				await audio.play();
				// setIsPlaying(true); // handled by event listener
			} catch (err) {
				alert('Playback failed. Please interact with the page first.');
				console.error(err);
				setIsPlaying(false);
			}
		} else {
			audio.pause();
			// setIsPlaying(false); // handled by event listener
		}
	};

	const handleProgressClick = (e: React.MouseEvent) => {
		const audio = audioRef.current;
		const progressBar = progressRef.current;
		if (!audio || !progressBar) return;
		const rect = progressBar.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const newTime = (clickX / rect.width) * duration;
		audio.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const toggleMute = () => {
		setIsMuted((prev) => !prev);
	};

	return (
		<div className='flex w-full max-w-md items-center gap-4 rounded-md border p-4 shadow-md'>
			<div className='relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md'>
				<Image src={thumbnailUrl} alt={title} layout='fill' objectFit='cover' />
			</div>

			<div className='flex flex-col flex-1 justify-between gap-2'>
				<div className='text-sm font-medium'>
					<Input
						value={customTitle}
						onChange={(e) => setCustomTitle(e.target.value)}
						className='bg-white text-black h-2 w-full'
					/>
				</div>
				<div className='text-xs text-muted-foreground'>{artist}</div>

				<div
					ref={progressRef}
					className='h-2 w-full cursor-pointer rounded bg-gray-300'
					onClick={handleProgressClick}
				>
					<div
						className='h-full bg-blue-500'
						style={{ width: `${(currentTime / duration) * 100}%` }}
					/>
				</div>

				<div className='flex items-center justify-between text-sm text-muted-foreground'>
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>

			<div className='flex flex-col items-center justify-between gap-2'>
				<button onClick={togglePlay} className='text-primary hover:opacity-80'>
					{isPlaying ? <Pause /> : <Play />}
				</button>
				<button onClick={toggleMute} className='text-primary hover:opacity-80'>
					{isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
				</button>
				<input
					type='range'
					min={0}
					max={1}
					step={0.01}
					value={volume}
					onChange={(e) => setVolume(parseFloat(e.target.value))}
					className='w-20'
				/>
			</div>
		</div>
	);
}
