'use client';

import { useSSE } from '@/hooks/useSSE';
import { useEffect, useState } from 'react';

export default function Home() {
	const { isConnected, messages, sendMessage } = useSSE();
	const [inputMessage, setInputMessage] = useState('Hello SSE!');

	// Add this to debug messages
	useEffect(() => {
		console.log('Current messages:', messages);
	}, [messages]);

	const handleSendMessage = () => {
		if (inputMessage.trim()) {
			console.log('Sending message:', inputMessage);
			sendMessage(inputMessage);
			setInputMessage(''); // Clear input after sending
		}
	};

	return (
		<main className='flex min-h-screen flex-col items-center justify-between p-24'>
			<div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
				<h1 className='text-4xl font-bold mb-4'>Server-Sent Events Test</h1>

				<div className='mb-4 p-2 rounded bg-gray-100'>
					Status:{' '}
					{isConnected ? (
						<span className='text-green-600 font-bold'>Connected</span>
					) : (
						<span className='text-red-600 font-bold'>Disconnected</span>
					)}
				</div>

				<div className='flex gap-2 mb-4'>
					<input
						type='text'
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						className='flex-grow p-2 border rounded'
						placeholder='Type a message...'
						onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
					/>
					<button
						className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
						onClick={handleSendMessage}
					>
						Send Message
					</button>
				</div>

				<div className='mt-4 p-4 border rounded bg-white'>
					<h2 className='text-2xl mb-2'>Messages:</h2>
					{messages.length === 0 ? (
						<p className='text-gray-500 italic'>No messages yet</p>
					) : (
						<ul className='space-y-2'>
							{messages.map((msg, index) => (
								<li key={index} className='p-2 bg-gray-50 rounded'>
									{typeof msg === 'string' ? msg : JSON.stringify(msg)}
								</li>
							))}
						</ul>
					)}
					<p className='mt-2 text-gray-500'>
						Total messages: {messages.length}
					</p>
				</div>
			</div>
		</main>
	);
}
