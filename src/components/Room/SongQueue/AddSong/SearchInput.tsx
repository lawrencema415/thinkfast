import React, { useState } from 'react';

interface SearchInputProps {
	onSearch: (query: string) => void;
	sourceType: 'spotify' | 'youtube';
	loading: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
	onSearch,
	sourceType,
	loading,
}) => {
	const [query, setQuery] = useState('');

	const handleSearch = () => {
		if (query.trim()) {
			onSearch(query);
		}
	};

	return (
		<div className='flex items-center space-x-4'>
			<input
				type='text'
				className='px-4 py-2 border rounded'
				placeholder={`Search on ${
					sourceType === 'spotify' ? 'Spotify' : 'YouTube'
				}`}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				disabled={loading}
			/>
			<button
				className='px-4 py-2 bg-blue-500 text-white rounded'
				onClick={handleSearch}
				disabled={loading || !query.trim()}
			>
				{loading ? 'Loading...' : 'Search'}
			</button>
		</div>
	);
};

export default SearchInput;
