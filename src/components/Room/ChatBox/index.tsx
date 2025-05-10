'use client';

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	MESSAGE_TYPE,
	Message,
	Player,
	Round,
	Song,
	SystemMessage,
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

	const hasGuessed = useMemo(
		() => round?.guesses.some((g) => g.userId === user.user.id),
		[round, user.user.id]
	);

	const userMap = useMemo(() => {
		const map = new Map<string, Player>();
		for (const player of users) {
			if (player.user?.id) map.set(player.user.id, player);
		}
		return map;
	}, [users]);

	const allMessages = useMemo(
		() => [...messages, ...optimisticMessages],
		[messages, optimisticMessages]
	);

	useEffect(() => {
		setOptimisticMessages((prev) =>
			prev.filter(
				(optimisticMsg) =>
					!messages.some((serverMsg) => serverMsg.id === optimisticMsg.id)
			)
		);
	}, [messages]);

	useEffect(() => {
		setUserGuessed(false);
	}, [round]);

	useEffect(() => {
		if (message && showHelp) setShowHelp(false);
	}, [message, showHelp]);

	useEffect(() => {
		const scrollContainer =
			scrollAreaRef.current?.querySelector<HTMLDivElement>(
				'[data-radix-scroll-area-viewport]'
			);
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	}, [allMessages]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const trimmed = message.trim();
			if (!trimmed) return;

			const alreadyGuessed = hasGuessed || userGuessed;

			if (isGuessing && currentTrack) {
				if (!alreadyGuessed) {
					if (fuzzyMatch(trimmed, currentTrack.title)) {
						setUserGuessed(true);
						setMessage('');

						toast({
							title: 'Correct Guess!',
							description: `Nice! You guessed "${currentTrack.title}" correctly.`,
							variant: 'default',
							duration: 3000,
						});

						axios
							.post('/api/game/guess', {
								currentTime: Date.now(),
								guess: trimmed,
								roomCode,
								round,
								timePerSong,
								userId: user.user.id,
							})
							.catch((error) =>
								toast({
									title: 'Guess submission failed',
									description:
										error instanceof Error ? error.message : 'Unknown error',
									variant: 'destructive',
								})
							);

						return;
					}

					if (isCloseMatch(trimmed, currentTrack.title)) {
						setMessage('');
						setShowHelp(true);
						return;
					}
				} else {
					// User already guessed, block any fuzzy/close matches from sending
					if (
						fuzzyMatch(trimmed, currentTrack.title) ||
						isCloseMatch(trimmed, currentTrack.title)
					) {
						setMessage('');
						toast({
							title: 'You already guessed!',
							description: 'Your message was too close to the answer.',
							variant: 'default',
							duration: 3000,
						});
						return;
					}
				}
			}

			// Allowed to send message (chat or incorrect guess)
			const optimisticMsg: Message = {
				id: uuidv4(),
				roomId: roomCode,
				displayName: user?.user.user_metadata?.display_name || 'Anonymous',
				avatarUrl: user?.user.user_metadata?.avatarUrl || '',
				user,
				content: trimmed,
				type: isGuessing ? MESSAGE_TYPE.GUESS : MESSAGE_TYPE.CHAT,
				createdAt: new Date(),
			};

			setOptimisticMessages((prev) => [...prev, optimisticMsg]);
			addMessageToBatch({ content: trimmed, id: optimisticMsg.id });
			setMessage('');
		},
		[
			message,
			hasGuessed,
			userGuessed,
			toast,
			isGuessing,
			currentTrack,
			roomCode,
			round,
			timePerSong,
			user,
			addMessageToBatch,
		]
	);

	return (
		<div className='flex h-[500px] flex-col rounded-lg bg-gray-800 p-4'>
			{showHelp && <PrivateHintToast hint='You are close!' />}
			<div className='mb-4'>
				<h3 className='text-lg font-heading font-bold'>
					{isGuessing ? 'Make your guess!' : 'Chat'}
				</h3>
			</div>
			<ScrollArea className='mb-4 flex-1' ref={scrollAreaRef}>
				<div className='space-y-4'>
					{allMessages.map((msg, idx) => {
						let player: Player | null = null;

						if (
							'content' in msg &&
							msg.type !== 'system' &&
							msg.user?.user?.id
						) {
							player = userMap.get(msg.user.user.id) || null;
						}

						return <MessageRow key={msg.id + idx} msg={msg} player={player} />;
					})}
				</div>
			</ScrollArea>

			<form onSubmit={handleSubmit} className='flex space-x-2'>
				<Input
					autoComplete='off'
					className='flex-1'
					onChange={(e) => setMessage(e.target.value)}
					placeholder={isGuessing ? 'Type your guess...' : 'Type a message...'}
					value={message}
				/>
				<Button type='submit' disabled={!message.trim()}>
					<Send className='h-4 w-4' />
				</Button>
			</form>
		</div>
	);
}
