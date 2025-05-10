import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Round } from '@shared/schema';
import { Music2 } from 'lucide-react';
import { Hint } from './Hint';
import {
	getLocalStorage,
	LOCALSTORAGE_KEYS,
	setLocalStorage,
} from '@/lib/localStorage';

interface GamePlayerProps {
	totalRounds: number;
	isPlaying: boolean;
	timePerSong: number;
	round: Round | null;
	disabled?: boolean;
}

export function GamePlayer({
	totalRounds,
	isPlaying,
	timePerSong,
	round,
	disabled,
}: GamePlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const volume = getLocalStorage(LOCALSTORAGE_KEYS.VOLUME, 0.5);

	const { roundNumber, song, startedAt, hash } = round ?? {};

	const [startedAtTime, setStartedAtTime] = useState<number | null>(() =>
		startedAt instanceof Date
			? startedAt.getTime()
			: startedAt
			? new Date(startedAt).getTime()
			: null
	);

	useEffect(() => {
		const newStartedAtTime =
			startedAt instanceof Date
				? startedAt.getTime()
				: startedAt
				? new Date(startedAt).getTime()
				: null;

		setStartedAtTime(newStartedAtTime);
	}, [startedAt, song]);

	const [trackRunTime, setTrackRunTime] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			if (startedAtTime) {
				const now = Date.now();
				setTrackRunTime(Math.max(0, now - startedAtTime));
			}
		}, 10);
		return () => clearInterval(interval);
	}, [startedAtTime, song]);

	useEffect(() => {
		if (!startedAtTime || !song?.previewUrl || disabled) return;

		const audio = audioRef.current;
		if (!audio) return;

		audio.pause();
		audio.src = song.previewUrl;
		audio.load();

		let stopTimeout: NodeJS.Timeout | null = null;

		const handleLoadedMetadata = () => {
			const now = Date.now();
			const elapsed = (now - startedAtTime) / 1000;
			const remaining = Math.max(0, timePerSong - elapsed);

			if (remaining <= 0) {
				audio.pause();
				return;
			}

			let playFrom = Math.max(0, audio.duration - timePerSong + elapsed);
			if (playFrom > audio.duration - 0.2) {
				playFrom = Math.max(0, audio.duration - 0.2);
			}
			audio.currentTime = playFrom;
		};

		const handleCanPlay = () => {
			const now = Date.now();
			const elapsed = (now - startedAtTime) / 1000;
			const remaining = Math.max(0, timePerSong - elapsed);

			if (remaining <= 0) {
				audio.pause();
				return;
			}

			audio.play().catch(() => {});
			stopTimeout = setTimeout(() => {
				audio.pause();
			}, remaining * 1000);
		};

		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('canplay', handleCanPlay);

		return () => {
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('canplay', handleCanPlay);
			if (stopTimeout) clearTimeout(stopTimeout);
		};
	}, [song?.previewUrl, isPlaying, timePerSong, startedAtTime, disabled]);

	useEffect(() => {
		const audio = audioRef.current;
		if (audio) {
			audio.volume = volume;
		}
		setLocalStorage(LOCALSTORAGE_KEYS.VOLUME, volume);
	}, [volume, audioRef]);

	if (!song || disabled) {
		return (
			<div className='bg-gray-800 rounded-lg p-6 text-center mb-5'>
				<Music2 className='h-12 w-12 mx-auto mb-4 text-gray-400' />
				<p className='text-gray-300'>Waiting for game to start...</p>
			</div>
		);
	}

	return (
		<Card className='w-full max-w-3xl mx-auto'>
			<CardHeader>
				<CardTitle className='text-center'>
					<div className='text-center mb-6'>
						<h2 className='text-xl font-heading font-bold mb-2'>
							Song {roundNumber} of {totalRounds} playing
						</h2>
						<p className='text-gray-400'>Guess the song</p>
					</div>
				</CardTitle>
			</CardHeader>

			<CardContent>
				{song && hash && (
					<Hint
						hash={hash}
						song={song}
						timePerSong={timePerSong}
						trackRunTime={trackRunTime}
					/>
				)}
				<audio ref={audioRef} />
			</CardContent>
		</Card>
	);
}
