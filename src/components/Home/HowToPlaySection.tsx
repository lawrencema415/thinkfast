'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Plus, MessageSquare } from 'lucide-react';

export function HowToPlaySection() {
	return (
		<section id='game-section' className='py-16 md:py-24 bg-dark'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-heading font-bold text-center mb-12'>
					How to Play
				</h2>
				<div className='grid md:grid-cols-3 gap-8'>
					<Card className='bg-gray-800 border-gray-700'>
						<CardHeader>
							<div className='bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Music className='h-6 w-6 text-primary' />
							</div>
							<CardTitle>1. Create or Join a Room</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-300'>
								Start a new room and invite friends with a room code, or join an
								existing room to play together.
							</p>
						</CardContent>
					</Card>

					<Card className='bg-gray-800 border-gray-700'>
						<CardHeader>
							<div className='bg-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Plus className='h-6 w-6 text-secondary' />
							</div>
							<CardTitle>2. Add Your Songs</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-300'>
								Each player adds 2-5 songs from Spotify or YouTube. These become
								the tracks everyone will try to guess.
							</p>
						</CardContent>
					</Card>

					<Card className='bg-gray-800 border-gray-700'>
						<CardHeader>
							<div className='bg-indigo-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<MessageSquare className='h-6 w-6 text-indigo-500' />
							</div>
							<CardTitle>3. Guess and Score</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-300'>
								Listen to song snippets and type guesses in the chat. Faster
								correct guesses earn more points!
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
