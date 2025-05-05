import { Music } from 'lucide-react';
import React from 'react';

type LoadingVariant = 'barwave' | 'emoji' | 'note';

interface LoadingScreenProps {
	variant?: LoadingVariant;
}

export default function LoadingScreen({
	variant = 'barwave',
}: LoadingScreenProps) {
	const renderLoader = () => {
		switch (variant) {
			case 'emoji':
				return (
					<div className='flex flex-col items-center text-[hsl(var(--primary))]'>
						<div className='text-5xl animate-bounce'>🎵</div>
						<p className='mt-4 text-muted-foreground text-sm animate-pulse'>
							Listening for the beat...
						</p>
					</div>
				);

			case 'note':
				return (
					<div className='flex flex-col items-center text-[hsl(var(--primary))]'>
						<Music className='w-10 h-10 animate-ping' />
						<p className='mt-4 text-muted-foreground text-sm animate-pulse'>
							Finding your track...
						</p>
					</div>
				);

			case 'barwave':
			default:
				return (
					<div className='flex items-end gap-1 h-10'>
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className='w-1.5 rounded-sm bg-[hsl(var(--primary))] animate-barWave'
								style={{ animationDelay: `${i * 0.15}s` }}
							/>
						))}
					</div>
				);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-black'>
			{renderLoader()}
		</div>
	);
}
