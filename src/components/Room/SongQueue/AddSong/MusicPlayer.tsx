import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX, Pencil } from 'lucide-react';
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
	const inputRef = useRef<HTMLInputElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(30);
	const [volume, setVolume] = useState(0.5);
	const [isMuted, setIsMuted] = useState(false);
	const [showVolume, setShowVolume] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);

	// Autofocus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

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
			} catch (err) {
				alert('Playback failed. Please interact with the page first.');
				console.log(err);
				setIsPlaying(false);
			}
		} else {
			audio.pause();
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
		<div className='flex w-full max-w-lg items-center gap-4 rounded-lg border border-gray-700 bg-[#18181b] p-4 shadow-md'>
			{/* Thumbnail and artist */}
			<div className='flex flex-col items-center w-20'>
				<div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md'>
					<Image
						src={thumbnailUrl}
						alt={title}
						fill
						className='object-cover'
						sizes='64px'
					/>
				</div>
				<div className='mt-2 w-full text-center text-xs text-gray-400 truncate'>
					{artist}
				</div>
			</div>

			{/* Song Info and Progress */}
			<div className='flex flex-1 flex-col gap-2 ml-2'>
				<div className='relative'>
					<Input
						ref={inputRef}
						value={customTitle}
						onChange={(e) => setCustomTitle(e.target.value)}
						className='rounded-md border border-gray-600 bg-zinc-900 px-2 py-1 pr-9 text-base font-semibold text-white placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'
						style={{ minWidth: 0 }}
						maxLength={60}
						onFocus={() => setShowTooltip(true)}
						onBlur={() => setShowTooltip(false)}
						placeholder='Song name'
					/>
					<Pencil
						size={18}
						className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
					/>
					{showTooltip && (
						<div className='absolute right-0 top-full mt-1 rounded bg-zinc-800 px-2 py-1 text-xs text-gray-200 shadow-lg z-10'>
							You can edit the song name
						</div>
					)}
				</div>
				<div
					ref={progressRef}
					className='relative h-2 w-full cursor-pointer rounded bg-gray-700'
					onClick={handleProgressClick}
				>
					<div
						className='absolute left-0 top-0 h-2 rounded bg-blue-500'
						style={{ width: `${(currentTime / duration) * 100}%` }}
					/>
				</div>
				<div className='flex items-center justify-between text-xs text-gray-400'>
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>

			{/* Play/Volume controls */}
			<div className='flex flex-col items-center justify-center gap-3'>
				<button
					onClick={togglePlay}
					className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 focus:outline-none'
					aria-label={isPlaying ? 'Pause' : 'Play'}
				>
					{isPlaying ? <Pause size={18} /> : <Play size={18} />}
				</button>
				<div className='relative flex flex-col items-center'>
					<button
						onClick={toggleMute}
						onMouseEnter={() => setShowVolume(true)}
						onMouseLeave={() => setShowVolume(false)}
						onFocus={() => setShowVolume(true)}
						onBlur={() => setShowVolume(false)}
						className='flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 focus:outline-none'
						aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
						tabIndex={0}
					>
						{isMuted || volume === 0 ? (
							<VolumeX size={18} />
						) : (
							<Volume2 size={18} />
						)}
					</button>
					{/* Popover */}
					{showVolume && (
						<div
							className='absolute left-[-110px] top-1/2 z-10 flex h-8 w-28 -translate-y-1/2 items-center rounded bg-zinc-800 px-3 py-2 shadow-lg'
							onMouseEnter={() => setShowVolume(true)}
							onMouseLeave={() => setShowVolume(false)}
						>
							<input
								type='range'
								min={0}
								max={1}
								step={0.01}
								value={volume}
								onChange={(e) => setVolume(parseFloat(e.target.value))}
								className='w-full accent-blue-500'
								aria-label='Volume'
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
