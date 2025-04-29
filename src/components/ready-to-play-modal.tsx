import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { Users, Clock } from 'lucide-react';
import { useGame } from '@/hooks/use-game';
import { Room } from '@shared/schema';

interface ReadyToPlayModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ReadyToPlayModal({
	isOpen,
	onOpenChange,
}: ReadyToPlayModalProps) {
	const { user } = useAuth();
	const [, navigate] = useLocation();
	const { createRoomMutation, joinRoomMutation } = useGame();
	const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
	const [songsPerPlayer, setSongsPerPlayer] = useState(3);
	const [secondsPerSong, setSecondsPerSong] = useState(10);
	const [roomCode, setRoomCode] = useState('');

	if (!user) {
		navigate('/auth');
		return null;
	}

	const handleCreateRoom = () => {
		createRoomMutation.mutate(
			{
				songsPerPlayer,
				timePerSong: secondsPerSong,
			},
			{
				onSuccess: (room: Room) => {
					onOpenChange(false);
					setTimeout(() => {
						navigate(`/room/${room.code}`);
					}, 150);
				},
			}
		);
	};

	const handleJoinRoom = () => {
		joinRoomMutation.mutate(roomCode, {
			onSuccess: () => {
				onOpenChange(false);
				setTimeout(() => {
					navigate(`/room/${roomCode}`);
				}, 150);
			},
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='bg-dark text-white border-gray-700 sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='font-heading text-2xl text-center mb-6'>
						Ready to Play?
					</DialogTitle>
				</DialogHeader>

				<div className='flex mb-6'>
					<Button
						variant={activeTab === 'create' ? 'default' : 'outline'}
						className='flex-1 rounded-r-none'
						onClick={() => setActiveTab('create')}
					>
						Create Room
					</Button>
					<Button
						variant={activeTab === 'join' ? 'default' : 'outline'}
						className='flex-1 rounded-l-none'
						onClick={() => setActiveTab('join')}
					>
						Join Room
					</Button>
				</div>

				{activeTab === 'create' ? (
					<div className='space-y-6'>
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
											onChange={(e) =>
												setSongsPerPlayer(parseInt(e.target.value))
											}
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
											onChange={(e) =>
												setSecondsPerSong(parseInt(e.target.value))
											}
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
								{createRoomMutation.isPending
									? 'Creating Room...'
									: 'Create Room'}
							</Button>
						</div>
					</div>
				) : (
					<div className='space-y-6'>
						<div className='bg-gray-800/50 rounded-lg p-4'>
							<h2 className='text-lg font-heading mb-2'>
								Join an Existing Room
							</h2>
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
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
