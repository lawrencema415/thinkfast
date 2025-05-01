import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getUserColor } from '@/lib/utils';
import { Trophy, Share2 } from 'lucide-react';
import { PlayerWithUser } from '@shared/schema';

interface GameCompletedModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	players: PlayerWithUser[];
}

export function GameCompletedModal({
	isOpen,
	onOpenChange,
	players,
}: GameCompletedModalProps) {
	// Sort players by score, handling null scores as 0
	const sortedPlayers = [...players].sort(
		(a, b) => (b.score || 0) - (a.score || 0)
	);
	const handleShareResults = () => {
		const results = `ThinkFast Results:\n${sortedPlayers
			.map(
				(p, i) =>
					`${i + 1}. ${p.user.user_metadata.display_name}: ${p.score || 0} points`
			)
			.join('\n')}`;

		navigator.clipboard.writeText(results).then(() => {
			alert('Results copied to clipboard!');
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='bg-card text-card-foreground border-border sm:max-w-lg'>
				<DialogHeader className='space-y-4'>
					<div className='flex justify-center'>
						<div className='p-3 bg-primary/10 rounded-full ring-2 ring-primary/20'>
							<Trophy className='h-8 w-8 text-primary' />
						</div>
					</div>
					<div className='text-center space-y-2'>
						<DialogTitle className='font-heading text-2xl'>
							Game Completed!
						</DialogTitle>
						<DialogDescription className='text-muted-foreground'>
							Here are the final scores:
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className='mt-6 space-y-4'>
					{sortedPlayers.map((player, index) => (
						<div
							key={player.id}
							className={`flex items-center p-4 rounded-lg transition-colors ${
								index === 0
									? 'bg-primary/15 border border-primary/30'
									: 'bg-muted/50 hover:bg-muted/70'
							}`}
						>
							{/* Position indicator */}
							<div
								className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
									index === 0
										? 'bg-primary text-primary-foreground'
										: 'bg-muted-foreground/20 text-muted-foreground'
								}`}
							>
								{index === 0 ? (
									<Trophy className='h-4 w-4' />
								) : (
									<span className='font-medium text-sm'>{index + 1}</span>
								)}
							</div>

							{/* Player info */}
							<div className='flex items-center flex-1 min-w-0'>
								<Avatar className='h-8 w-8 mr-3 ring-2 ring-border'>
									<AvatarFallback
										className={getUserColor(
											player.user.user_metadata.display_name
										)}
									>
										{getInitials(player.user.user_metadata.display_name)}
									</AvatarFallback>
								</Avatar>
								<div className='truncate'>
									<p className='font-medium truncate'>
										{player.user.user_metadata.display_name}
									</p>
								</div>
							</div>

							{/* Score */}
							<div className='ml-4'>
								<span
									className={`text-xl font-bold font-mono ${
										index === 0 ? 'text-primary' : 'text-muted-foreground'
									}`}
								>
									{player.score || 0}
								</span>
							</div>
						</div>
					))}
				</div>

				<DialogFooter className='flex flex-col sm:flex-row gap-2 mt-6'>
					{/* <Button
						variant='outline'
						onClick={handleExitRoom}
						disabled={leaveRoomMutation.isPending}
						className='w-full sm:w-auto'
					>
						<LogOut className='h-4 w-4 mr-2' />
						Exit Room
					</Button>
					<Button
						onClick={handlePlayAgain}
						disabled={!isHost || playAgainMutation.isPending}
						className='w-full sm:w-auto'
					>
						<RefreshCw className='h-4 w-4 mr-2' />
						{isHost ? 'Play Again' : 'Waiting for host...'}
					</Button> */}
					<Button
						variant='secondary'
						onClick={handleShareResults}
						className='w-full sm:w-auto'
					>
						<Share2 className='h-4 w-4 mr-2' />
						Share Results
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
