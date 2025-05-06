'use client';

import { useState, useEffect } from 'react';

export function GameSection() {
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
				></div>
			</div>
		</section>
	);
}
