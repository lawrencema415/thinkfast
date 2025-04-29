import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Music, User2 } from 'lucide-react';
import { PlayerWithUser } from '@shared/schema';

interface StartGameModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	players: PlayerWithUser[];
	songsPerPlayer: number;
	onConfirm: () => void;
	isPending: boolean;
}

export function StartGameModal({
	isOpen,
	onOpenChange,
	players,
	songsPerPlayer,
	onConfirm,
	isPending,
}: StartGameModalProps) {
	const handleStartGame = () => {
		onConfirm();
	};

	const allPlayersReady = players.every((p) => (p.songsAdded ?? 0) >= 1);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='bg-dark text-white border-gray-700 sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='font-heading text-lg'>Start Game</DialogTitle>
					<DialogDescription className='text-gray-400'>
						Ready to begin the music guessing challenge?
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='bg-gray-800 rounded-lg p-3'>
						<h3 className='text-sm font-medium mb-2'>Player Status</h3>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[180px]'>Player</TableHead>
									<TableHead>Songs</TableHead>
									<TableHead className='text-right'>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{players.map((player) => (
									<TableRow key={player.id}>
										<TableCell className='font-medium flex items-center'>
											<User2 className='h-4 w-4 mr-2 text-gray-400' />
											{player.user.username}
										</TableCell>
										<TableCell>
											<div className='flex items-center'>
												<Music className='h-4 w-4 mr-1 text-gray-400' />
												{player.songsAdded}/{songsPerPlayer}
											</div>
										</TableCell>
										<TableCell className='text-right'>
											{player.songsAdded! >= songsPerPlayer ? (
												<span className='text-primary text-xs'>Ready</span>
											) : (
												<span className='text-warning text-xs'>
													Needs more songs
												</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<div className='bg-gray-800 rounded-lg p-3'>
						<h3 className='text-sm font-medium mb-2'>Game Rules</h3>
						<ul className='text-sm text-gray-300 space-y-1 pl-5 list-disc'>
							<li>Each player will guess the song title and artist</li>
							<li>Points are awarded for correct guesses</li>
							<li>The faster you guess, the more points you earn</li>
							<li>First player to correctly guess also gets bonus points</li>
						</ul>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleStartGame}
						disabled={!allPlayersReady || isPending}
					>
						{isPending ? 'Starting...' : 'Start Game'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
