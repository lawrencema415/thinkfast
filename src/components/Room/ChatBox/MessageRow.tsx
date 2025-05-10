'use client';

import React from 'react';
import {
	Message,
	Player,
	MESSAGE_TYPE,
	SYSTEM_MESSAGE_TYPE,
	SystemMessage,
} from '@/shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User2 } from 'lucide-react';

interface MessageRowProps {
	msg: Message | SystemMessage;
	player: Player | null;
}

export function MessageRow({ msg }: MessageRowProps) {
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
}
