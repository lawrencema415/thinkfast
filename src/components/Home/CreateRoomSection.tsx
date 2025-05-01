'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Clock } from 'lucide-react';
import { useState } from 'react';
import { useGame } from '@/hooks/use-game';
import { useRouter } from 'next/navigation';

export function CreateRoomForm() {
	const { createRoomMutation } = useGame();
	const [songsPerPlayer, setSongsPerPlayer] = useState(3);
	const [secondsPerSong, setSecondsPerSong] = useState(10);
	const router = useRouter();

	const handleCreateRoom = () => {
		createRoomMutation.mutate(
			{
				songsPerPlayer,
				timePerSong: secondsPerSong,
			},
			{
				onSuccess: (room) => {
					router.push(`/room/${room.code}`);
				},
			}
		);
	};

	return (
		<div className='bg-gray-800/50 rounded-lg p-4'>
			<h2 className='text-lg font-heading mb-2'>Create a New Room</h2>
			<p className='text-sm text-gray-400 mb-4'>
				Set up a room and invite friends to play
			</p>

			<div className='space-y-4'>
				<div>
					<Label className='text-sm mb-2 block'>Songs Per Player</Label>
					<div className='flex items-center space-x-3'>
						<Users className='h-4 w-4 text-gray-400' />
						<Input
							type='number'
							value={songsPerPlayer}
							onChange={(e) => setSongsPerPlayer(parseInt(e.target.value))}
							min={1}
							max={5}
							className='bg-gray-700'
						/>
					</div>
					<p className='text-xs text-gray-400 mt-1'>
						Each player can add 1-5 songs
					</p>
				</div>

				<div>
					<Label className='text-sm mb-2 block'>Seconds Per Song</Label>
					<div className='flex items-center space-x-3'>
						<Clock className='h-4 w-4 text-gray-400' />
						<Input
							type='number'
							value={secondsPerSong}
							onChange={(e) => setSecondsPerSong(parseInt(e.target.value))}
							min={5}
							max={15}
							className='bg-gray-700'
						/>
					</div>
					<p className='text-xs text-gray-400 mt-1'>
						How long each song plays (5-15 seconds)
					</p>
				</div>
			</div>

			<Button
				className='w-full mt-6'
				onClick={handleCreateRoom}
				disabled={createRoomMutation.isPending}
			>
				{createRoomMutation.isPending ? 'Creating Room...' : 'Create Room'}
			</Button>
		</div>
	);
}
