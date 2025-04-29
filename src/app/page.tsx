'use client';

import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState } from 'react';

export default function Home() {
	const { socket, isConnected, sendMessage } = useSocket();
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		if (!socket) return;

		socket.on('message', (message: string) => {
			setMessages((prev) => [...prev, message]);
		});

		return () => {
			socket.off('message');
		};
	}, [socket]);

	const handleSendMessage = () => {
		sendMessage('Hello WebSocket!');
	};

	return (
		<main className='flex min-h-screen flex-col items-center justify-between p-24'>
			<div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
				<h1 className='text-4xl font-bold mb-4'>WebSocket Test</h1>
				<div className='mb-4'>
					Status: {isConnected ? 'Connected' : 'Disconnected'}
				</div>
				<button
					className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
					onClick={handleSendMessage}
				>
					Send Test Message
				</button>
				<div className='mt-4'>
					<h2 className='text-2xl mb-2'>Messages:</h2>
					<ul>
						{messages.map((msg, index) => (
							<li key={index}>{msg}</li>
						))}
					</ul>
				</div>
			</div>
		</main>
	);
}
