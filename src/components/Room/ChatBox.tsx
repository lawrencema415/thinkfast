import { useState, useRef, useEffect } from 'react';
import { Message, Player } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User2 } from 'lucide-react';
import { sendMessage } from '@/lib/sendMessage';
import { useToast } from '@/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatBoxProps {
	messages: Message[];
	users: Player[];
	roomCode: string; // Add roomCode prop
	isGuessing?: boolean;
}

export function ChatBox({
	messages,
	roomCode,
	users,
	isGuessing = false,
}: ChatBoxProps) {
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();

	const scrollToBottom = () => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				'[data-radix-scroll-area-viewport]'
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	};

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			try {
				setIsSending(true);
				await sendMessage({
					roomCode,
					content: message.trim(),
					type: isGuessing ? 'guess' : 'chat',
				});
				setMessage('');
			} catch (error) {
				toast({
					title: 'Failed to send message',
					description: error instanceof Error ? error.message : 'Unknown error',
					variant: 'destructive',
				});
			} finally {
				setIsSending(false);
			}
		}
	};

	// Enhanced function to find user by userId with fallback
	const findUserByUserId = (userId: string) => {
		// First try to find the player in the current users array
		const player = users.find((player) => player.user?.id === userId);

		// If we found the player, return it
		if (player) return player;

		// No player found in current users array
		return null;
	};

	return (
		<div className='bg-gray-800 rounded-lg p-4 flex flex-col h-[500px]'>
			<div className='mb-4'>
				<h3 className='font-heading font-bold text-lg'>
					{isGuessing ? 'Make your guess!' : 'Chat'}
				</h3>
			</div>

			<ScrollArea className='flex-1 mb-4' ref={scrollAreaRef}>
				<div className='space-y-4'>
					{messages.map((msg, i) => {
						let player: Player | null = null;
						if (msg.user) {
							player = findUserByUserId(msg.user?.id);
						}

						const isSystem = msg.type === 'system';
						const isGuess = msg.type === 'guess';

						const displayName =
							msg.user?.user_metadata?.display_name || 'Unknown User';

						return (
							<div
								key={i}
								className={`flex items-start space-x-2 ${
									isSystem ? 'text-yellow-400 italic text-sm' : ''
								} ${isGuess ? 'text-green-400' : ''}`}
							>
								{!isSystem && (
									<Avatar className='h-8 w-8'>
										<AvatarImage
											src={player?.user?.user_metadata?.avatarUrl || ''}
											alt={displayName}
										/>
										<AvatarFallback>
											<User2 className='w-4 h-4' />
										</AvatarFallback>
									</Avatar>
								)}
								<div className='flex-1 break-words'>
									{!isSystem && (
										<span className='font-medium mr-2'>{displayName}:</span>
									)}
									<span>{msg.content}</span>
								</div>
							</div>
						);
					})}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>

			<form onSubmit={handleSubmit} className='flex space-x-2'>
				<Input
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={isGuessing ? 'Type your guess...' : 'Type a message...'}
					className='flex-1'
					autoComplete='off'
					disabled={isSending}
				/>
				<Button type='submit' disabled={!message.trim() || isSending}>
					<Send className='h-4 w-4' />
				</Button>
			</form>
		</div>
	);
}
