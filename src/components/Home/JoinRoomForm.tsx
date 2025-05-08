'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGame } from '@/hooks/useGame';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function JoinRoomForm() {
	const { joinRoomMutation } = useGame();
	const [roomCode, setRoomCode] = useState('');
	const router = useRouter();

	const handleJoinRoom = () => {
		joinRoomMutation.mutate(roomCode, {
			onSuccess: () => {
				router.push(`/room/${roomCode}`);
			},
		});
	};

	return (
		<div className='bg-gray-800/50 rounded-lg p-4'>
			<h2 className='text-lg font-heading mb-2'>Join an Existing Room</h2>
			<p className='text-sm text-gray-400 mb-4'>
				Enter a room code to join a game
			</p>

			<div className='space-y-4'>
				<div>
					<Label className='text-sm mb-2 block'>Room Code</Label>
					<Input
						value={roomCode}
						onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
						placeholder='Enter room code'
						className='bg-gray-700 uppercase'
					/>
					<p className='text-xs text-gray-400 mt-1'>
						Ask the room creator for this code
					</p>
				</div>
			</div>

			<Button
				className='w-full mt-6'
				onClick={handleJoinRoom}
				disabled={!roomCode || joinRoomMutation.isPending}
			>
				{joinRoomMutation.isPending ? 'Joining Room...' : 'Join Room'}
			</Button>
		</div>
	);
}
