'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateRoomForm } from './CreateRoomSection';
import { JoinRoomForm } from './JoinRoomForm';
import { useState, useEffect } from 'react';
import { PlusCircle, Users } from 'lucide-react';

interface GameSectionProps {
	activeTab: string;
	onTabChange: (value: string) => void;
}

export function GameSection({ activeTab, onTabChange }: GameSectionProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY;
			const sectionElement = document.getElementById('game-section');
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
			id='game-section'
			className='py-20 md:py-28 bg-gradient-to-br from-gray-900 via-dark to-gray-900 relative'
		>
			{/* Decorative elements */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-dark to-transparent'></div>
				<div className='absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-dark to-transparent'></div>
			</div>

			<div className='container mx-auto px-4 relative z-10'>
				<div
					className={`transition-all duration-700 transform ${
						isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
					}`}
				>
					<h2 className='text-3xl md:text-4xl font-heading font-bold text-center mb-4'>
						Ready to Play?
					</h2>
					<p className='text-gray-400 text-center mb-16 max-w-xl mx-auto'>
						Create a new room or join an existing one
					</p>

					<div className='max-w-md mx-auto bg-gray-900/40 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-800'>
						<Tabs value={activeTab} onValueChange={onTabChange}>
							<TabsList className='grid w-full grid-cols-2 mb-8 bg-gray-800/50'>
								<TabsTrigger
									value='create'
									className='data-[state=active]:bg-primary/20 data-[state=active]:text-primary'
								>
									<PlusCircle className='h-4 w-4 mr-2' />
									Create Room
								</TabsTrigger>
								<TabsTrigger
									value='join'
									className='data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary'
								>
									<Users className='h-4 w-4 mr-2' />
									Join Room
								</TabsTrigger>
							</TabsList>
							<TabsContent
								value='create'
								className='mt-0 focus-visible:outline-none focus-visible:ring-0'
							>
								<CreateRoomForm />
							</TabsContent>
							<TabsContent
								value='join'
								className='mt-0 focus-visible:outline-none focus-visible:ring-0'
							>
								<JoinRoomForm />
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>
		</section>
	);
}
