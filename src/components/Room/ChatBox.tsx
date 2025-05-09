'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
	Message,
	Player,
	MESSAGE_TYPE,
	SYSTEM_MESSAGE_TYPE,
	SystemMessage,
} from '@/shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { v4 as uuidv4 } from 'uuid';
import { useBatchSendMessages } from '@/hooks/useBatchSendMessages';

interface ChatBoxProps {
	messages: (Message | SystemMessage)[];
	users: Player[];
	user: Player;
	roomCode: string;
	isGuessing?: boolean;
}

const MessageRow = function MessageRow({
	msg,
}: {
	msg: Message | SystemMessage;
	player: Player | null;
}) {
	const isSystem = msg.type === SYSTEM_MESSAGE_TYPE;
	const isGuess = msg.type === MESSAGE_TYPE.GUESS;

	if (isSystem) {
		return (
			<div className='flex items-start space-x-2 text-yellow-400 italic text-sm'>
				<div className='flex-1 break-words'>
					<span>{msg.content}</span>
				</div>
			</div>
		);
	}

	const displayName = msg.displayName;
	const avatarUrl = msg.avatarUrl || '';

	return (
		<div
			className={`flex items-start space-x-2 ${
				isGuess ? 'text-green-400' : ''
			}`}
		>
			<Avatar className='h-8 w-8'>
				<AvatarImage src={avatarUrl} alt={displayName} />
				<AvatarFallback>
					<User2 className='w-4 h-4' />
				</AvatarFallback>
			</Avatar>
			<div className='flex-1 break-words'>
				<span className='font-medium mr-2'>{displayName}:</span>
				<span>{msg.content}</span>
			</div>
		</div>
	);
};

export function ChatBox({
	messages,
	roomCode,
	users,
	user,
	isGuessing = false,
}: ChatBoxProps) {
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();

	const addMessageToBatch = useBatchSendMessages(
		roomCode,
		isGuessing ? 'guess' : 'chat'
	);

	// Remove optimistic messages that are now present in server messages
	useEffect(() => {
		setOptimisticMessages((prev) =>
			prev.filter(
				(optimisticMsg) =>
					!messages.some((serverMsg) => serverMsg.id === optimisticMsg.id)
			)
		);
	}, [messages]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				'[data-radix-scroll-area-viewport]'
			) as HTMLDivElement | null;
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [messages, optimisticMessages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			try {
				setIsSending(true);
				const optimisticMsg: Message = {
					id: uuidv4(),
					roomId: roomCode,
					displayName: user?.user.user_metadata?.display_name || 'Unknown',
					avatarUrl: user?.user.user_metadata?.avatarUrl || '',
					user,
					content: message.trim(),
					type: isGuessing ? MESSAGE_TYPE.GUESS : MESSAGE_TYPE.CHAT,
					createdAt: new Date(),
				};
				setOptimisticMessages((prev) => [...prev, optimisticMsg]);
				addMessageToBatch({ content: message.trim(), id: optimisticMsg.id });
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

	const allMessages = useMemo(
		() => [...messages, ...optimisticMessages],
		[messages, optimisticMessages]
	);

	const userMap = useMemo(() => {
		const map = new Map<string, Player>();
		users.forEach((player) => {
			if (player.user?.id) {
				map.set(player.user.id, player);
			}
		});
		return map;
	}, [users]);

	return (
		<div className='bg-gray-800 rounded-lg p-4 flex flex-col h-[500px]'>
			<div className='mb-4'>
				<h3 className='font-heading font-bold text-lg'>
					{isGuessing ? 'Make your guess!' : 'Chat'}
				</h3>
			</div>

			<ScrollArea className='flex-1 mb-4' ref={scrollAreaRef}>
				<div className='space-y-4'>
					{allMessages.map((msg) => {
						let player: Player | null = null;
						if (
							(msg.type === MESSAGE_TYPE.CHAT ||
								msg.type === MESSAGE_TYPE.GUESS) &&
							msg.user?.user?.id
						) {
							player = userMap.get(msg.user.user.id) || null;
						}
						return <MessageRow key={msg.id} msg={msg} player={player} />;
					})}
				</div>
			</ScrollArea>

			<form onSubmit={handleSubmit} className='flex space-x-2'>
				<Input
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={isGuessing ? 'Type your guess...' : 'Type a message...'}
					className='flex-1'
					autoComplete='off'
				/>
				<Button type='submit' disabled={!message.trim() || isSending}>
					<Send className='h-4 w-4' />
				</Button>
			</form>
		</div>
	);
}
