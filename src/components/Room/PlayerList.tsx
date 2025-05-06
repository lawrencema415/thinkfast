import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@supabase/supabase-js';

interface PlayerListProps {
	players: User[];
	hostId: string;
	songsPerPlayer: number;
}

export function PlayerList({
	players,
	hostId,
}: // songsPerPlayer,
PlayerListProps) {
	// Sort players by score (highest first)
	// const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

	return (
		<div className='bg-dark rounded-lg shadow-lg p-4'>
			<h2 className='font-heading text-lg font-semibold mb-4'>
				Players ({players.length})
			</h2>
			<div className='space-y-3'>
				{players.map((player) => (
					<div
						key={player.id}
						className='flex items-center justify-between p-2 rounded-lg bg-surface bg-opacity-50 hover:bg-opacity-70 transition-colors'
					>
						<div className='flex items-center space-x-3'>
							<Avatar>
								<AvatarFallback>User</AvatarFallback>
							</Avatar>
							<div>
								<p className='font-medium'>
									{player?.user_metadata?.display_name}
									{player.id === hostId && (
										<span className='text-xs text-primary ml-1'>(Host)</span>
									)}
								</p>
								{/* <p className='text-xs text-gray-400'>
									Songs Added: {player.songsAdded}/{songsPerPlayer}
								</p> */}
							</div>
						</div>
						<span className='text-lg font-bold text-accent'>0</span>
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
