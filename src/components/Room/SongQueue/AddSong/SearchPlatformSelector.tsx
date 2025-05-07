import { Button } from '@/components/ui/button';
import React from 'react';

interface SearchPlatformSelectorProps {
	sourceType: 'spotify' | 'youtube';
	onSelect: (type: 'spotify' | 'youtube') => void;
}

function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill='none'
			height='24'
			viewBox='0 0 24 24'
			width='24'
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			<circle cx='12' cy='12' fill='#1ED760' r='12' />
			<path
				d='M17.25 16.1c-.2.33-.62.44-.95.24-2.6-1.6-5.88-1.97-9.75-1.1-.38.08-.75-.16-.83-.54-.08-.38.16-.75.54-.83 4.18-.93 7.77-.51 10.65 1.22.33.2.44.62.24.95zm1.35-2.7c-.25.4-.77.53-1.17.28-2.98-1.84-7.53-2.38-11.05-1.33-.46.14-.95-.12-1.09-.58-.14-.46.12-.95.58-1.09 4.01-1.17 8.97-.58 12.32 1.5.4.25.53.77.28 1.17zm1.41-2.81c-.31.5-.97.66-1.47.35-3.42-2.11-8.64-2.58-12.13-1.44-.56.18-1.16-.13-1.34-.69-.18-.56.13-1.16.69-1.34 4.01-1.29 9.74-.76 13.61 1.61.5.31.66.97.35 1.47z'
				fill='#fff'
			/>
		</svg>
	);
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill='none'
			height='24'
			viewBox='0 0 24 24'
			width='24'
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			<rect fill='#FF0000' height='16' rx='4' width='22' x='1' y='4' />
			<polygon fill='#fff' points='10,16 16,12 10,8' />
		</svg>
	);
}

const SearchPlatformSelector: React.FC<SearchPlatformSelectorProps> = ({
	sourceType,
	onSelect,
}) => {
	return (
		<div className='flex space-x-2'>
			<Button
				type='button'
				variant={sourceType === 'spotify' ? 'default' : 'outline'}
				className='flex-1'
				onClick={() => onSelect('spotify')}
			>
				<SpotifyIcon className='h-4 w-4 mr-2' /> Spotify
			</Button>
			<div className='relative flex-1 group cursor-not-allowed'>
				<Button
					type='button'
					variant={sourceType === 'youtube' ? 'default' : 'outline'}
					className='w-full'
					onClick={() => onSelect('youtube')}
					disabled
				>
					<YoutubeIcon className='h-4 w-4 mr-2' /> YouTube
				</Button>
				<div className='cursor-default absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 bg-black rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap'>
					Unavailable for now
				</div>
			</div>
		</div>
	);
};

export default SearchPlatformSelector;
