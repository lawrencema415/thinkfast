import { Song } from '@/shared/schema';
import React from 'react';
import Image from 'next/image';

interface SongSearchResultsProps {
	results: Song[];
	onSelect: (song: Song) => void;
	loading: boolean;
}

const SearchResults: React.FC<SongSearchResultsProps> = ({
	results,
	onSelect,
	loading,
}) => {
	if (loading) {
		return <div>Loading results...</div>;
	}

	if (results.length === 0) {
		return <div>No results found</div>;
	}

	return (
		<div className='space-y-4'>
			{results.map((song) => (
				<div
					key={song.id}
					className='flex items-center space-x-4 p-4 border rounded cursor-pointer hover:bg-gray-100'
					onClick={() => onSelect(song)}
				>
					<Image
						src={song.albumArt}
						alt={song.title}
						className='w-16 h-16 rounded'
						height={32}
						width={32}
					/>
					<div className='flex-1'>
						<div className='font-semibold'>{song.title}</div>
						<div className='text-sm text-gray-600'>{song.artist}</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default SearchResults;
