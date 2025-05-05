'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Plus, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HowToPlaySection() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			const sectionElement = document.getElementById('how-to-play-section');
			if (sectionElement) {
				const sectionTop = sectionElement.offsetTop;
				if (scrollPosition > sectionTop - window.innerHeight / 1.5) {
					setIsVisible(true);
				}
			}
		};

		window.addEventListener('scroll', handleScroll);
		// Initial check
		handleScroll();

		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<section
			id='how-to-play-section'
			className='py-20 md:py-28 bg-dark relative overflow-hidden'
		>
			{/* Background decorative elements */}
			<div className='absolute inset-0 opacity-5'>
				<div className='absolute top-0 left-0 w-full h-full opacity-10'></div>
			</div>

			<div className='container mx-auto px-4 relative z-10'>
				<h2 className='text-3xl md:text-4xl font-heading font-bold text-center mb-4'>
					How to Play
				</h2>
				<p className='text-gray-400 text-center mb-16 max-w-xl mx-auto'>
					Three simple steps to start challenging your friends
				</p>

				<div className='grid md:grid-cols-3 gap-8 md:gap-10'>
					<Card
						className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
							isVisible
								? 'translate-y-0 opacity-100'
								: 'translate-y-10 opacity-0'
						}`}
						style={{ transitionDelay: '0ms' }}
					>
						<CardHeader className='pb-2'>
							<div className='bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
								<Music className='h-8 w-8 text-primary' />
							</div>
							<CardTitle className='text-center text-xl'>
								1. Create or Join a Room
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400 text-center'>
								Start a new room and invite friends with a room code, or join an
								existing room to play together.
							</p>
						</CardContent>
					</Card>

					<Card
						className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
							isVisible
								? 'translate-y-0 opacity-100'
								: 'translate-y-10 opacity-0'
						}`}
						style={{ transitionDelay: '150ms' }}
					>
						<CardHeader className='pb-2'>
							<div className='bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
								<Plus className='h-8 w-8 text-secondary' />
							</div>
							<CardTitle className='text-center text-xl'>
								2. Add Your Songs
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400 text-center'>
								Each player adds 2-5 songs from Spotify or YouTube. These become
								the tracks everyone will try to guess.
							</p>
						</CardContent>
					</Card>

					<Card
						className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
							isVisible
								? 'translate-y-0 opacity-100'
								: 'translate-y-10 opacity-0'
						}`}
						style={{ transitionDelay: '300ms' }}
					>
						<CardHeader className='pb-2'>
							<div className='bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
								<MessageSquare className='h-8 w-8 text-indigo-500' />
							</div>
							<CardTitle className='text-center text-xl'>
								3. Guess and Score
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-gray-400 text-center'>
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
