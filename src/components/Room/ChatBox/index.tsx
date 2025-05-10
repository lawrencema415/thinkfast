'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
	Message,
	Player,
	MESSAGE_TYPE,
	SystemMessage,
	Song,
	Round,
} from '@/shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import { useBatchSendMessages } from '@/hooks/useBatchSendMessages';
import { MessageRow } from './MessageRow';
import axios from 'axios';
import { fuzzyMatch, isCloseMatch } from './utils';
import { PrivateHintToast } from '../PrivateHintToast';

interface ChatBoxProps {
	currentTrack?: Song | null;
	isGuessing?: boolean;
	messages: (Message | SystemMessage)[];
	roomCode: string;
	round: Round | null;
	timePerSong: number;
	user: Player;
	users: Player[];
}

export function ChatBox({
	currentTrack,
	isGuessing = false,
	messages,
	roomCode,
	round,
	timePerSong,
	user,
	users,
}: ChatBoxProps) {
	const [message, setMessage] = useState('');
	const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
	const [userGuessed, setUserGuessed] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
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

	// Reset guess state on new round
	useEffect(() => {
		setUserGuessed(false);
	}, [round]);

	// Dismiss hint if user types again
	useEffect(() => {
		if (message && showHelp) setShowHelp(false);
	}, [message, showHelp]);

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

	const hasGuessed = round?.guesses.some(
		(guess) => guess.userId === user.user.id
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (hasGuessed || userGuessed) {
			setMessage('');
			toast({
				title: 'You have already guessed the song!',
				description: 'You can only guess once',
				variant: 'default',
				duration: 3000,
			});
			return;
		}

		const trimmedMessage = message.trim();
		if (!trimmedMessage) return;

		// --- GUESSING MODE ---
		if (isGuessing && currentTrack) {
			// Correct guess: Optimistically update UI, fire-and-forget network call
			if (fuzzyMatch(trimmedMessage, currentTrack.title)) {
				setUserGuessed(true);
				setMessage('');

				axios
					.post('/api/game/guess', {
						currentTime: Date.now(),
						guess: trimmedMessage,
						roomCode,
						round,
						timePerSong,
						userId: user.user.id,
					})
					.catch((error) => {
						toast({
							title: 'Failed to submit guess',
							description:
								error instanceof Error ? error.message : 'Unknown error',
							variant: 'destructive',
							duration: 3000,
						});
						// Optionally, allow retry or rollback optimistic state
					});

				return;
			} else if (isCloseMatch(trimmedMessage, currentTrack.title)) {
				setMessage('');
				setShowHelp(true);

				return;
			}
		}

		// --- CHAT OR INCORRECT GUESS ---
		const optimisticMsg: Message = {
			id: uuidv4(),
			roomId: roomCode,
			displayName: user?.user.user_metadata?.display_name || 'Unknown',
			avatarUrl: user?.user.user_metadata?.avatarUrl || '',
			user,
			content: trimmedMessage,
			type: isGuessing ? MESSAGE_TYPE.GUESS : MESSAGE_TYPE.CHAT,
			createdAt: new Date(),
		};
		setOptimisticMessages((prev) => [...prev, optimisticMsg]);
		addMessageToBatch({ content: trimmedMessage, id: optimisticMsg.id });
		setMessage('');
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
			{showHelp && <PrivateHintToast hint='You are close!' />}
			<ScrollArea className='flex-1 mb-4' ref={scrollAreaRef}>
				<div className='space-y-4'>
					{allMessages.map((msg, index) => {
						let player: Player | null = null;
						if (
							(msg.type === MESSAGE_TYPE.CHAT ||
								msg.type === MESSAGE_TYPE.GUESS) &&
							msg.user?.user?.id
						) {
							player = userMap.get(msg.user.user.id) || null;
						}
						return (
							<MessageRow key={msg.id + index} msg={msg} player={player} />
						);
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
				<Button type='submit'>
					<Send className='h-4 w-4' />
				</Button>
			</form>
		</div>
	);
}
