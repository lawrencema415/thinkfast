'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface SettingsModalProps {
	roomCode: string;
	currentSongsPerPlayer: number;
	currentTimePerSong: number;
	isHost: boolean;
}

// Define constants for min and max values
const MIN_SONGS_PER_PLAYER = 1;
const MAX_SONGS_PER_PLAYER = 5;
const MIN_TIME_PER_SONG = 5;
const MAX_TIME_PER_SONG = 15;

export function SettingsModal({
	roomCode,
	currentSongsPerPlayer,
	currentTimePerSong,
	isHost,
}: SettingsModalProps) {
	const initialSongsPerPlayer = Math.min(
		Math.max(currentSongsPerPlayer, MIN_SONGS_PER_PLAYER),
		MAX_SONGS_PER_PLAYER
	);
	const initialTimePerSong = Math.min(
		Math.max(currentTimePerSong, MIN_TIME_PER_SONG),
		MAX_TIME_PER_SONG
	);

	const [songsPerPlayer, setSongsPerPlayer] = useState(initialSongsPerPlayer);
	const [timePerSong, setTimePerSong] = useState(initialTimePerSong);
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		if (!isOpen) {
			setSongsPerPlayer(initialSongsPerPlayer);
			setTimePerSong(initialTimePerSong);
		}
	}, [initialSongsPerPlayer, initialTimePerSong, isOpen]);

	const handleSubmit = async () => {
		if (!isHost) {
			toast({
				title: 'Permission Denied',
				description: 'Only the host can change game settings.',
				variant: 'destructive',
			});
			return;
		}

		try {
			setIsSubmitting(true);
			const response = await fetch('/api/rooms/update', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					roomCode,
					songsPerPlayer,
					timePerSong,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to update settings');
			}

			toast({
				title: 'Settings Updated',
				description: 'Game settings have been updated successfully.',
			});

			setIsOpen(false);
		} catch (error) {
			toast({
				title: 'Update Failed',
				description:
					error instanceof Error ? error.message : 'Unknown error occurred',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant='outline'
					className={`flex items-center gap-2 ${
						!isHost ? 'opacity-50 cursor-not-allowed' : ''
					}`}
					disabled={!isHost}
				>
					<Settings className='h-4 w-4' />
					Settings
				</Button>
			</DialogTrigger>
			<DialogContent className='bg-black text-white border-zinc-800 sm:max-w-[425px]'>
				<DialogHeader className='mb-4'>
					<DialogTitle className='text-xl font-bold'>Game Settings</DialogTitle>
					<DialogDescription className='text-zinc-400 mt-1'>
						Adjust the game settings for this room. Only the host can change
						these settings.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-8 py-2'>
					<div className='space-y-5'>
						<div className='flex justify-between items-center'>
							<Label htmlFor='songsPerPlayer' className='text-base font-medium'>
								Songs Per Player
							</Label>
							<div className='bg-pink-500 text-white font-medium rounded-md w-8 h-8 flex items-center justify-center'>
								{songsPerPlayer}
							</div>
						</div>
						<Slider
							id='songsPerPlayer'
							min={MIN_SONGS_PER_PLAYER}
							max={MAX_SONGS_PER_PLAYER}
							step={1}
							value={[songsPerPlayer]}
							onValueChange={(value) => setSongsPerPlayer(value[0])}
							className='w-full'
						/>
						<div className='flex justify-between text-sm text-zinc-400 px-1'>
							<span>{MIN_SONGS_PER_PLAYER}</span>
							<span>{MAX_SONGS_PER_PLAYER}</span>
						</div>
					</div>

					<div className='space-y-5'>
						<div className='flex justify-between items-center'>
							<Label htmlFor='timePerSong' className='text-base font-medium'>
								Time Per Song (seconds)
							</Label>
							<div className='bg-pink-500 text-white font-medium rounded-md w-8 h-8 flex items-center justify-center'>
								{timePerSong}
							</div>
						</div>
						<Slider
							id='timePerSong'
							min={MIN_TIME_PER_SONG}
							max={MAX_TIME_PER_SONG}
							step={1}
							value={[timePerSong]}
							onValueChange={(value) => setTimePerSong(value[0])}
							className='w-full'
						/>
						<div className='flex justify-between text-sm text-zinc-400 px-1'>
							<span>{MIN_TIME_PER_SONG}</span>
							<span>{MAX_TIME_PER_SONG}</span>
						</div>
					</div>
				</div>

				<div className='mt-8 flex justify-end'>
					<Button
						onClick={handleSubmit}
						disabled={isSubmitting || !isHost}
						className='bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0'
					>
						{isSubmitting ? 'Saving...' : 'Save changes'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
