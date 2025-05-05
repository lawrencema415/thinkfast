'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Headphones, Music, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export function FeatureSection() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			const sectionElement = document.getElementById('feature-section');
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
			id='feature-section'
			className='py-20 md:py-28 bg-gradient-to-br from-gray-900 to-dark relative overflow-hidden'
		>
			{/* Background decorative elements */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl'></div>
				<div className='absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl'></div>
			</div>

			<div className='container mx-auto px-4 relative z-10'>
				<div
					className={`transition-all duration-700 transform ${
						isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
					}`}
				>
					<h2 className='text-3xl md:text-4xl font-heading font-bold text-center mb-4'>
						Game Features
					</h2>
					<p className='text-gray-400 text-center mb-16 max-w-2xl mx-auto'>
						Experience the most exciting music guessing game with your friends
					</p>

					<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6'>
						<Card
							className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
								isVisible
									? 'translate-y-0 opacity-100'
									: 'translate-y-10 opacity-0'
							} hover:shadow-primary/10 hover:shadow-lg hover:-translate-y-1`}
							style={{ transitionDelay: '0ms' }}
						>
							<CardHeader className='pb-2'>
								<div className='bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
									<Music className='h-8 w-8 text-primary' />
								</div>
								<CardTitle className='text-center text-xl'>
									Multiple Music Sources
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-gray-400 text-center'>
									Add songs from various platforms including Spotify and YouTube
								</p>
							</CardContent>
						</Card>

						<Card
							className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
								isVisible
									? 'translate-y-0 opacity-100'
									: 'translate-y-10 opacity-0'
							} hover:shadow-secondary/10 hover:shadow-lg hover:-translate-y-1`}
							style={{ transitionDelay: '150ms' }}
						>
							<CardHeader className='pb-2'>
								<div className='bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
									<Users className='h-8 w-8 text-secondary' />
								</div>
								<CardTitle className='text-center text-xl'>
									Multiplayer Fun
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-gray-400 text-center'>
									Play with friends in real-time and compete for the highest
									score
								</p>
							</CardContent>
						</Card>

						<Card
							className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
								isVisible
									? 'translate-y-0 opacity-100'
									: 'translate-y-10 opacity-0'
							} hover:shadow-indigo-500/10 hover:shadow-lg hover:-translate-y-1`}
							style={{ transitionDelay: '300ms' }}
						>
							<CardHeader className='pb-2'>
								<div className='bg-indigo-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
									<Zap className='h-8 w-8 text-indigo-500' />
								</div>
								<CardTitle className='text-center text-xl'>
									Fast-Paced Rounds
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-gray-400 text-center'>
									Quick rounds keep the game exciting and players on their toes
								</p>
							</CardContent>
						</Card>

						<Card
							className={`bg-gray-900/60 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-700 transform ${
								isVisible
									? 'translate-y-0 opacity-100'
									: 'translate-y-10 opacity-0'
							} hover:shadow-purple-500/10 hover:shadow-lg hover:-translate-y-1`}
							style={{ transitionDelay: '450ms' }}
						>
							<CardHeader className='pb-2'>
								<div className='bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto'>
									<Headphones className='h-8 w-8 text-purple-500' />
								</div>
								<CardTitle className='text-center text-xl'>
									Music Discovery
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-gray-400 text-center'>
									Discover new music while playing with friends and having fun
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</section>
	);
}
