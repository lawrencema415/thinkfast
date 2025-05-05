'use client';

import { Button } from '@/components/ui/button';
import { MusicWave } from '@/components/ui/music-wave';
import { ChevronRight, Headphones, Music } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
	onStartPlaying: () => void;
}

export function HeroSection({ onStartPlaying }: HeroSectionProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Trigger animation after component mounts
		const timer = setTimeout(() => setIsVisible(true), 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<section className='relative overflow-hidden bg-gradient-to-br from-primary/10 via-dark to-secondary/10 py-20 md:py-32'>
			{/* Decorative elements */}
			<div className='absolute top-20 left-10 opacity-10 animate-pulse'>
				<Music className='h-32 w-32 text-primary' />
			</div>
			<div
				className='absolute bottom-20 right-10 opacity-10 animate-pulse'
				style={{ animationDelay: '1s' }}
			>
				<Headphones className='h-32 w-32 text-secondary' />
			</div>

			{/* Animated circles */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl'></div>
				<div className='absolute -bottom-40 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl'></div>
			</div>

			<div className='container mx-auto px-4 text-center relative z-10'>
				<div
					className={`transition-all duration-1000 transform ${
						isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
					}`}
				>
					<h1 className='text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight'>
						<span className='text-primary'>Think</span>
						<span className='text-white'>Fast</span>
					</h1>
					<p className='text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed'>
						The ultimate multiplayer music guessing game. Test your knowledge
						and reflexes.
					</p>
					<div className='flex justify-center mb-12'>
						<MusicWave className='h-16' />
					</div>
					<Button
						size='lg'
						className='text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300'
						onClick={onStartPlaying}
					>
						Start Playing <ChevronRight className='ml-2 h-5 w-5' />
					</Button>
				</div>
			</div>
		</section>
	);
}
