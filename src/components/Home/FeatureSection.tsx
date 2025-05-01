'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Headphones, Music, Users, Zap } from 'lucide-react';

export function FeatureSection() {
	return (
		<section className='py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-heading font-bold text-center mb-4'>
					Game Features
				</h2>
				<p className='text-gray-400 text-center mb-12 max-w-2xl mx-auto'>
					Experience the most exciting music guessing game with your friends
				</p>

				<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
					<Card className='bg-gray-800/50 border-gray-700'>
						<CardHeader>
							<div className='bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Music className='h-6 w-6 text-primary' />
							</div>
							<CardTitle>Multiple Music Sources</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400'>
								Add songs from various platforms including Spotify and YouTube
							</p>
						</CardContent>
					</Card>

					<Card className='bg-gray-800/50 border-gray-700'>
						<CardHeader>
							<div className='bg-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Users className='h-6 w-6 text-secondary' />
							</div>
							<CardTitle>Multiplayer Fun</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400'>
								Play with friends in real-time and compete for the highest score
							</p>
						</CardContent>
					</Card>

					<Card className='bg-gray-800/50 border-gray-700'>
						<CardHeader>
							<div className='bg-indigo-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Zap className='h-6 w-6 text-indigo-500' />
							</div>
							<CardTitle>Fast-Paced Rounds</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400'>
								Quick rounds keep the game exciting and players on their toes
							</p>
						</CardContent>
					</Card>

					<Card className='bg-gray-800/50 border-gray-700'>
						<CardHeader>
							<div className='bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
								<Headphones className='h-6 w-6 text-purple-500' />
							</div>
							<CardTitle>Music Discovery</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400'>
								Discover new music while playing with friends and having fun
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
