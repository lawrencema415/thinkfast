import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/shared/schema';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

interface PlayerListProps {
	players: Player[];
	hostId: string;
	songsPerPlayer: number;
	userId: string;
	roomCode: string;
}

export function PlayerList({
	players,
	hostId,
	userId,
	roomCode,
}: PlayerListProps) {
	const [isRemoving, setIsRemoving] = useState<string | null>(null);
	const { toast } = useToast();

	const handleKickPlayer = async (playerId: string) => {
		if (userId !== hostId) return;

		try {
			setIsRemoving(playerId);
			await axios.post('/api/rooms/remove', {
				playerId,
				roomCode,
			});
			toast({
				title: 'Player removed',
				description: 'The player has been removed from the room',
			});
		} catch (error) {
			console.error('Failed to remove player:', error);
			toast({
				title: 'Error',
				description: 'Failed to remove player from the room',
				variant: 'destructive',
			});
		} finally {
			setIsRemoving(null);
		}
	};

	return (
		<div className='bg-dark rounded-lg shadow-lg p-4'>
			<h2 className='font-heading text-lg font-semibold mb-4'>
				Players ({players.length})
			</h2>
			<div className='space-y-2'>
				{players.map(({ user, score }) => {
					const isHost = user?.id === hostId;
					const isCurrentUser = user?.id === userId;
					const initials =
						user?.user_metadata?.display_name?.[0]?.toUpperCase() || 'U';

					return (
						<div
							key={user?.id}
							className='flex items-center justify-between rounded-md bg-surface bg-opacity-60 hover:bg-opacity-80 transition-colors px-4 py-3'
						>
							<div className='flex items-center gap-3 min-w-0'>
								<Avatar className='h-9 w-9'>
									<AvatarFallback className='text-xs'>
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className='min-w-0'>
									<div className='flex items-center gap-1'>
										<span
											className={`font-medium truncate ${
												isCurrentUser ? 'text-yellow-400' : ''
											}`}
										>
											{user?.user_metadata?.display_name}
										</span>
										{isHost && (
											<span className='ml-1 text-xs text-primary font-semibold'>
												(Host)
											</span>
										)}
									</div>
									{/* <div className="text-xs text-gray-400">
                    Songs Added: {player.songsAdded}/{songsPerPlayer}
                  </div> */}
								</div>
							</div>
							<div className='flex items-center gap-2'>
								<span className='text-lg font-bold text-accent tabular-nums min-w-[2ch] text-right'>
									{score ?? 0}
								</span>
								{userId === hostId && user?.id !== userId && (
									<Button
										variant='ghost'
										size='sm'
										className='text-red-500 hover:text-red-700 hover:bg-red-100 p-1 h-auto'
										onClick={() => handleKickPlayer(user?.id)}
										disabled={isRemoving === user?.id}
									>
										<UserX size={16} />
									</Button>
								)}
							</div>
						</div>
					);
				})}

				{players.length === 0 && (
					<div className='text-center py-4 text-gray-400'>
						No players have joined yet
					</div>
				)}
			</div>
		</div>
	);
}
