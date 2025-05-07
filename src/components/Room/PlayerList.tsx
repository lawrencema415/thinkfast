import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Player } from '@/shared/schema';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

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
}: // songsPerPlayer,
PlayerListProps) {
	// Sort players by score (highest first)
	// const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
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
			<div className='space-y-3'>
				{players.map(({ user }) => (
					<div
						key={user?.id}
						className='flex items-center justify-between p-2 rounded-lg bg-surface bg-opacity-50 hover:bg-opacity-70 transition-colors'
					>
						<div className='flex items-center space-x-3'>
							<Avatar>
								<AvatarFallback>User</AvatarFallback>
							</Avatar>
							<div>
								<p className={`font-medium ${user?.id === userId ? 'text-yellow-400' : ''}`}>
									{user?.user_metadata?.display_name}
									{user?.id === hostId && (
										<span className='text-xs text-primary ml-1'>(Host)</span>
									)}
								</p>
								{/* <p className='text-xs text-gray-400'>
									Songs Added: {player.songsAdded}/{songsPerPlayer}
								</p> */}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className='text-lg font-bold text-accent'>0</span>
							{userId === hostId && user?.id !== userId && (
								<Button 
									variant="ghost" 
									size="sm" 
									className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 h-auto"
									onClick={() => handleKickPlayer(user?.id)}
									disabled={isRemoving === user?.id}
								>
									<UserX size={16} />
								</Button>
							)}
						</div>
					</div>
				))}

				{players.length === 0 && (
					<div className='text-center py-4 text-gray-400'>
						No players have joined yet
					</div>
				)}
			</div>
		</div>
	);
}
