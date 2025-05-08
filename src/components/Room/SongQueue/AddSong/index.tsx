'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { useGame } from '@/hooks/useGame';
import { useToast } from '@/hooks/useToast';
import { type SpotifyTrack } from '@/lib/spotify';
import SearchPlatformSelector from './SearchPlatformSelector';
import { createPortal } from 'react-dom';
import MusicPlayer from './MusicPlayer';

interface AddSongProps {
	roomCode: string;
	songQueue: SpotifyTrack[];
	userId: string;
}

type SourceType = 'spotify' | 'youtube';
// type SearchResult = SpotifyTrack | YouTubeVideo;

export function AddSong({ roomCode, songQueue, userId }: AddSongProps) {
	const { toast } = useToast();
	const { addSongMutation } = useGame();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false); // Avoid SSR issues
	const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

	const [sourceType, setSourceType] = useState<SourceType>('spotify');
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
	const [searchPreviewResults, setSearchPreviewResults] = useState<
		SpotifyTrack[]
	>([]);
	const [selectedResult, setSelectedResult] = useState<SpotifyTrack | null>(
		null
	);
	const [isSearching, setIsSearching] = useState(false);
	const [customTitle, setCustomTitle] = useState('');
	const [customArtist, setCustomArtist] = useState('');
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Clear state when modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			setSearchQuery('');
			setSearchResults([]);
			setSelectedResult(null);
			setIsSearching(false);
			setCustomTitle('');
			setCustomArtist('');
			setPreviewUrl(null);

			// Stop any playing audio
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
			}
		}
	}, [isOpen]);

	console.log(songQueue);

	// Handle audio element events
	useEffect(() => {
		setMounted(true);
		const root = document.getElementById('modal-root');
		setModalRoot(root);
	}, []);

	// When a result is selected, update custom title/artist
	useEffect(() => {
		if (selectedResult && sourceType === 'spotify') {
			const spotifyTrack = selectedResult as SpotifyTrack;
			setCustomTitle(spotifyTrack.name);
			setCustomArtist(spotifyTrack.artists[0].name);
		}
	}, [selectedResult, sourceType]);

	const handleSearch = async () => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		try {
			if (sourceType === 'spotify') {
				const previewResponse = await fetch(`/api/spotify/previews`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: searchQuery }),
				});
				const { enrichedTracks } = await previewResponse.json();
				setSearchResults(enrichedTracks);
				setSearchPreviewResults(enrichedTracks);
			}
		} catch (error) {
			toast({
				title: 'Search failed',
				description: (error as Error).message,
				variant: 'destructive',
			});
		} finally {
			setIsSearching(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	const handleSelectResult = (result: SpotifyTrack) => {
		setSelectedResult(result);

		// Set preview URL if it's a Spotify track with preview
		if (sourceType === 'spotify') {
			const spotifyTrack = result as SpotifyTrack;
			const previewResult =
				searchPreviewResults?.find((track) => track.id === spotifyTrack.id) ||
				spotifyTrack;
			const preview = previewResult?.preview_url;

			setPreviewUrl(preview);
		}
	};

	const handleAddSong = () => {
		if (!selectedResult) return;

		// Determine the sourceId of the selected result
		const newSourceId = (selectedResult as SpotifyTrack).id;

		const newSong = {
			title: customTitle,
			artist: customArtist,
			albumArt: (selectedResult as SpotifyTrack).album.images[0]?.url,
			sourceType,
			sourceId: newSourceId,
			previewUrl:
				searchPreviewResults.find(
					(track) => track.id === (selectedResult as SpotifyTrack).id
				)?.preview_url || '',
			userId,
			id: Math.random().toString(36).substring(2, 11),
		};

		addSongMutation.mutate(
			{
				roomCode,
				song: newSong,
			},
			{
				onError: () => {
					toast({
						title: 'Song already added',
						description: 'This song has already been added to the queue',
						variant: 'destructive',
					});
				},
				onSuccess: () => {
					toast({
						title: 'Song added',
						description: 'Your song has been added to the queue',
					});
					// Close modal
					setIsOpen(false);
				},
			}
		);
		// Close modal
		setIsOpen(false);
	};

	const renderThumbnail = (result: SpotifyTrack) => {
		const spotifyTrack = result as SpotifyTrack;
		return spotifyTrack.album.images[0]?.url || '/no-thumbnail.png';
	};

	const renderTitle = (result: SpotifyTrack) => {
		if (sourceType === 'spotify') {
			return (result as SpotifyTrack).name;
		}
	};

	const renderArtist = (result: SpotifyTrack) => {
		if (sourceType === 'spotify') {
			const spotifyTrack = result as SpotifyTrack;
			return `${spotifyTrack.artists[0].name} • ${spotifyTrack.album.name}`;
		}
	};

	const isSelected = (result: SpotifyTrack) => {
		if (!selectedResult) return false;

		if (sourceType === 'spotify') {
			return (
				(result as SpotifyTrack).id === (selectedResult as SpotifyTrack).id
			);
		}
	};

	const selectedPreviewResult = searchPreviewResults?.find(
		(track) => track.id === selectedResult?.id
	);

	return (
		<>
			<Button
				onClick={() => {
					setIsOpen(true);
				}}
			>
				Add Song
			</Button>

			{mounted &&
				modalRoot &&
				createPortal(
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogContent className='bg-dark text-white border-gray-700 sm:max-w-lg'>
							{/* Hidden audio element for previews */}
							<audio ref={audioRef} className='hidden' preload='metadata' />

							<DialogHeader>
								<DialogTitle className='font-heading text-lg'>
									Add a Song
								</DialogTitle>
							</DialogHeader>

							<div className='space-y-6'>
								<div>
									<SearchPlatformSelector
										sourceType={sourceType}
										onSelect={(type) => setSourceType(type)}
									/>
								</div>

								<div>
									<div className='relative'>
										<Input
											id='songSearch'
											type='text'
											placeholder='Enter song title or artist...'
											className='pr-10'
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											onKeyDown={handleKeyPress}
											disabled={isSearching || addSongMutation.isPending}
										/>
										<Button
											type='button'
											variant='ghost'
											loading={isSearching}
											size='icon'
											className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8'
											onClick={handleSearch}
											disabled={
												isSearching ||
												!searchQuery.trim() ||
												addSongMutation.isPending
											}
										>
											{!isSearching && <Search className='h-4 w-4' />}
										</Button>
									</div>
								</div>

								{searchResults.length > 0 && (
									<div className='bg-gray-800 rounded-lg p-3'>
										<h4 className='font-medium mb-2'>Search Results</h4>
										<div className='max-h-60 overflow-y-auto space-y-2'>
											{searchResults.map((result, index) => (
												<div
													key={index}
													className={`flex items-center p-2 rounded hover:bg-surface cursor-pointer transition-colors ${
														isSelected(result) ? 'bg-muted' : ''
													}`}
													onClick={() => handleSelectResult(result)}
												>
													<Image
														src={renderThumbnail(result) || '/placeholder.svg'}
														alt='Album cover'
														className='w-10 h-10 rounded mr-3'
														height={32}
														width={32}
													/>
													<div className='flex-1'>
														<h5 className='text-sm font-medium'>
															{renderTitle(result)}
														</h5>
														<p className='text-xs text-gray-400'>
															{renderArtist(result)}
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{selectedResult && previewUrl && (
									<MusicPlayer
										audioRef={audioRef}
										previewUrl={previewUrl}
										thumbnailUrl={
											renderThumbnail(selectedResult) || '/placeholder.svg'
										}
										customTitle={customTitle}
										setCustomTitle={setCustomTitle}
										title={selectedPreviewResult?.name || ''}
										artist={selectedPreviewResult?.artists?.[0]?.name || ''}
									/>
								)}
							</div>

							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setIsOpen(false)}
									disabled={addSongMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									onClick={handleAddSong}
									disabled={!selectedResult || addSongMutation.isPending}
									loading={addSongMutation.isPending}
								>
									{addSongMutation.isPending ? 'Adding...' : 'Add Song'}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>,
					modalRoot
				)}
		</>
	);
}
