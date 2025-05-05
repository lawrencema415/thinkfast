import React from 'react';

export default function AddSongModalProps() {
	return <div>add-song-modal</div>;
}

// import { useState, useEffect, useRef } from 'react';
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle,
// 	DialogFooter,
// } from '@/components/ui/dialog';
// import {
// 	Select,
// 	SelectContent,
// 	SelectGroup,
// 	SelectItem,
// 	SelectLabel,
// 	SelectTrigger,
// 	SelectValue,
// } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
// 	Check,
// 	X,
// 	Play,
// 	Pause,
// 	Pencil,
// 	Search,
// 	Music,
// 	Volume2,
// } from 'lucide-react';
// import { useGame } from '@/hooks/use-game';
// import { useToast } from '@/hooks/use-toast';
// import { SpotifyTrack, searchSpotifyTracks } from '@/lib/spotify';
// import {
// 	YouTubeVideo,
// 	searchYouTubeVideos,
// 	parseYouTubeTitle,
// } from '@/lib/youtube';

// // import { fetchSpotifyPreviews } from '@/lib/spotify';
// import { useWebSocket } from '@/lib/websocket';
// import {
// 	Tooltip,
// 	TooltipContent,
// 	TooltipProvider,
// 	TooltipTrigger,
// } from '@/components/ui/tooltip';

// interface AddSongModalProps {
// 	isOpen: boolean;
// 	onOpenChange: (open: boolean) => void;
// 	roomId: string;
// 	songQueue: SpotifyTrack[];
// }

// type SourceType = 'spotify' | 'youtube';
// type SearchResult = SpotifyTrack | YouTubeVideo;

// export function AddSongModal({
// 	isOpen,
// 	onOpenChange,
// 	roomId,
// 	songQueue,
// }: AddSongModalProps) {
// 	const { toast } = useToast();
// 	const { addSongMutation } = useGame();
// 	const audioRef = useRef<HTMLAudioElement | null>(null);

// 	const [sourceType, setSourceType] = useState<SourceType>('spotify');
// 	const [searchQuery, setSearchQuery] = useState('');
// 	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
// 	const [searchPreviewResults, setSearchPreviewResults] = useState<
// 		SpotifyTrack[]
// 	>([]);
// 	const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
// 		null
// 	);
// 	const [isSearching, setIsSearching] = useState(false);
// 	const [selectedGenre, setSelectedGenre] = useState('');
// 	const [customTitle, setCustomTitle] = useState('');
// 	const [customArtist, setCustomArtist] = useState('');
// 	const [isEditing, setIsEditing] = useState(false);
// 	const [isPlaying, setIsPlaying] = useState(false);
// 	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
// 	const { sendMessage } = useWebSocket();

// 	// Clear state when modal opens/closes
// 	useEffect(() => {
// 		if (!isOpen) {
// 			setSearchQuery('');
// 			setSearchResults([]);
// 			setSelectedResult(null);
// 			setIsSearching(false);
// 			setSelectedGenre('');
// 			setCustomTitle('');
// 			setCustomArtist('');
// 			setIsEditing(false);
// 			setIsPlaying(false);
// 			setPreviewUrl(null);

// 			// Stop any playing audio
// 			if (audioRef.current) {
// 				audioRef.current.pause();
// 				audioRef.current.currentTime = 0;
// 			}
// 		}
// 	}, [isOpen]);

// 	// Handle audio element events
// 	useEffect(() => {
// 		if (audioRef.current) {
// 			const handleAudioEnd = () => {
// 				setIsPlaying(false);
// 			};

// 			audioRef.current.addEventListener('ended', handleAudioEnd);

// 			return () => {
// 				audioRef.current?.removeEventListener('ended', handleAudioEnd);
// 			};
// 		}
// 	}, [audioRef.current]);

// 	// When a result is selected, update custom title/artist
// 	useEffect(() => {
// 		if (selectedResult) {
// 			if (sourceType === 'spotify') {
// 				const spotifyTrack = selectedResult as SpotifyTrack;
// 				setCustomTitle(spotifyTrack.name);
// 				setCustomArtist(spotifyTrack.artists[0].name);
// 			} else {
// 				const youtubeVideo = selectedResult as YouTubeVideo;
// 				const { title, artist } = parseYouTubeTitle(youtubeVideo.snippet.title);
// 				setCustomTitle(title);
// 				setCustomArtist(artist || youtubeVideo.snippet.channelTitle);
// 			}
// 		}
// 	}, [selectedResult, sourceType]);

// 	const handleSearch = async () => {
// 		if (!searchQuery.trim()) return;

// 		setIsSearching(true);
// 		try {
// 			if (sourceType === 'spotify') {
// 				const tracks = await searchSpotifyTracks(searchQuery);
// 				const ids = tracks.map((track) => track.id);
// 				const previewResponse = await fetch(`/api/spotify/previews`, {
// 					method: 'POST',
// 					headers: { 'Content-Type': 'application/json' },
// 					body: JSON.stringify({ ids }),
// 				});
// 				const { enrichedTracks } = await previewResponse.json();
// 				setSearchResults(tracks);
// 				setSearchPreviewResults(enrichedTracks);
// 			} else {
// 				const videos = await searchYouTubeVideos(searchQuery);
// 				setSearchResults(videos);
// 			}
// 		} catch (error) {
// 			toast({
// 				title: 'Search failed',
// 				description: (error as Error).message,
// 				variant: 'destructive',
// 			});
// 		} finally {
// 			setIsSearching(false);
// 		}
// 	};

// 	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
// 		if (e.key === 'Enter') {
// 			handleSearch();
// 		}
// 	};

// 	const handleSelectResult = (result: SearchResult) => {
// 		setSelectedResult(result);
// 		setIsEditing(false);

// 		// Set preview URL if it's a Spotify track with preview
// 		if (sourceType === 'spotify') {
// 			const spotifyTrack = result as SpotifyTrack;
// 			setPreviewUrl(spotifyTrack.preview_url);
// 		}
// 	};

// 	const handlePreviewPlay = (result: SearchResult, e: React.MouseEvent) => {
// 		e.stopPropagation(); // Prevent selecting the result when clicking the preview button

// 		// For Spotify tracks
// 		if (sourceType === 'spotify') {
// 			const spotifyTrack = result as SpotifyTrack;
// 			// Find the matching preview result from searchPreviewResults
// 			const previewResult =
// 				searchPreviewResults?.find((track) => track.id === spotifyTrack.id) ||
// 				spotifyTrack; // Fallback to the original track if preview not found
// 			const previewUrl = previewResult?.preview_url;

// 			if (!previewUrl) {
// 				toast({
// 					title: 'Preview unavailable',
// 					description: 'No preview available for this track',
// 					variant: 'destructive',
// 				});
// 				return;
// 			}

// 			// If already playing this track, stop it
// 			if (isPlaying && previewUrl === audioRef.current?.src) {
// 				if (audioRef.current) {
// 					audioRef.current.pause();
// 					setIsPlaying(false);
// 				}
// 			} else {
// 				// Play the track
// 				setPreviewUrl(previewUrl);
// 				if (audioRef.current) {
// 					audioRef.current.src = previewUrl;
// 					audioRef.current.currentTime = 0;
// 					audioRef.current.play().catch((error) => {
// 						console.error('Error playing preview:', error);
// 						toast({
// 							title: 'Playback error',
// 							description: 'Could not play preview',
// 							variant: 'destructive',
// 						});
// 					});
// 					setIsPlaying(true);
// 				}
// 			}
// 		}
// 		// For YouTube videos
// 		else {
// 			toast({
// 				title: 'YouTube preview',
// 				description:
// 					'Preview not available for YouTube tracks in the search interface',
// 				variant: 'default',
// 			});
// 		}
// 	};

// 	const handleToggleEdit = () => {
// 		setIsEditing(!isEditing);
// 	};

// 	const handleAddSong = () => {
// 		if (!selectedResult) return;

// 		// Determine the sourceId of the selected result
// 		const newSourceId =
// 			sourceType === 'spotify'
// 				? (selectedResult as SpotifyTrack).id
// 				: (selectedResult as YouTubeVideo).id.videoId;

// 		// Check for duplicates in the existing queue, using sourceId, SpotifyTrack type might be incorrect
// 		const alreadyAdded = songQueue.some((song: any) => {
// 			// assuming song.sourceId is the same field on queued items
// 			return song.sourceId === newSourceId;
// 		});

// 		if (alreadyAdded) {
// 			toast({
// 				title: 'Song already added',
// 				description: 'This song has been added to the queue already',
// 				variant: 'destructive',
// 			});
// 			return;
// 		}

// 		// Build the payload as before
// 		let previewUrl: string | null = null;
// 		if (sourceType === 'spotify') {
// 			const spotifyTrack = selectedResult as SpotifyTrack;
// 			const previewResult = searchPreviewResults.find(
// 				(track) => track.id === spotifyTrack.id
// 			);
// 			previewUrl = previewResult?.preview_url ?? null;
// 		}

// 		addSongMutation.mutate({
// 			title: customTitle,
// 			artist: customArtist,
// 			albumArt:
// 				sourceType === 'spotify'
// 					? (selectedResult as SpotifyTrack).album.images[0]?.url
// 					: (selectedResult as YouTubeVideo).snippet.thumbnails.high.url,
// 			genre: selectedGenre,
// 			sourceType,
// 			sourceId: newSourceId,
// 			previewUrl,
// 		});

// 		// Close modal
// 		onOpenChange(false);
// 	};

// 	const renderThumbnail = (result: SearchResult) => {
// 		if (sourceType === 'spotify') {
// 			const spotifyTrack = result as SpotifyTrack;
// 			return spotifyTrack.album.images[0]?.url;
// 		} else {
// 			const youtubeVideo = result as YouTubeVideo;
// 			return youtubeVideo.snippet.thumbnails.default.url;
// 		}
// 	};

// 	const renderTitle = (result: SearchResult) => {
// 		if (sourceType === 'spotify') {
// 			return (result as SpotifyTrack).name;
// 		} else {
// 			return (result as YouTubeVideo).snippet.title;
// 		}
// 	};

// 	const renderArtist = (result: SearchResult) => {
// 		if (sourceType === 'spotify') {
// 			const spotifyTrack = result as SpotifyTrack;
// 			return `${spotifyTrack.artists[0].name} • ${spotifyTrack.album.name}`;
// 		} else {
// 			const youtubeVideo = result as YouTubeVideo;
// 			return youtubeVideo.snippet.channelTitle;
// 		}
// 	};

// 	const isSelected = (result: SearchResult) => {
// 		if (!selectedResult) return false;

// 		if (sourceType === 'spotify') {
// 			return (
// 				(result as SpotifyTrack).id === (selectedResult as SpotifyTrack).id
// 			);
// 		} else {
// 			return (
// 				(result as YouTubeVideo).id.videoId ===
// 				(selectedResult as YouTubeVideo).id.videoId
// 			);
// 		}
// 	};

// 	return (
// 		<Dialog open={isOpen} onOpenChange={onOpenChange}>
// 			<DialogContent className='bg-dark text-white border-gray-700 sm:max-w-lg'>
// 				{/* Hidden audio element for previews */}
// 				<audio ref={audioRef} className='hidden' />

// 				<DialogHeader>
// 					<DialogTitle className='font-heading text-lg'>Add a Song</DialogTitle>
// 				</DialogHeader>

// 				<div className='space-y-6'>
// 					<div>
// 						<label className='block text-sm font-medium mb-2'>
// 							Search Platform
// 						</label>
// 						<div className='flex space-x-2'>
// 							<Button
// 								type='button'
// 								variant={sourceType === 'spotify' ? 'default' : 'outline'}
// 								className='flex-1'
// 								onClick={() => setSourceType('spotify')}
// 							>
// 								<SpotifyIcon className='h-4 w-4 mr-2' /> Spotify
// 							</Button>
// 							<div className='relative flex-1 group cursor-not-allowed'>
// 								<Button
// 									type='button'
// 									variant={sourceType === 'youtube' ? 'default' : 'outline'}
// 									className='w-full'
// 									onClick={() => setSourceType('youtube')}
// 									disabled
// 								>
// 									<YoutubeIcon className='h-4 w-4 mr-2' /> YouTube
// 								</Button>
// 								<div className='cursor-default absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 bg-black rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap'>
// 									Unavailable for now
// 								</div>
// 							</div>
// 						</div>
// 					</div>

// 					<div>
// 						<label
// 							htmlFor='songSearch'
// 							className='block text-sm font-medium mb-2'
// 						>
// 							Search for a song
// 						</label>
// 						<div className='relative'>
// 							<Input
// 								id='songSearch'
// 								type='text'
// 								placeholder='Enter song title or artist...'
// 								className='pr-10'
// 								value={searchQuery}
// 								onChange={(e) => setSearchQuery(e.target.value)}
// 								onKeyDown={handleKeyPress}
// 								disabled={isSearching || addSongMutation.isPending}
// 							/>
// 							<Button
// 								type='button'
// 								variant='ghost'
// 								loading={isSearching}
// 								size='icon'
// 								className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8'
// 								onClick={handleSearch}
// 								disabled={
// 									isSearching ||
// 									!searchQuery.trim() ||
// 									addSongMutation.isPending
// 								}
// 							>
// 								{!isSearching && <Search className='h-4 w-4' />}
// 							</Button>
// 						</div>
// 					</div>

// 					{searchResults.length > 0 && (
// 						<div className='bg-gray-800 rounded-lg p-3'>
// 							<h4 className='font-medium mb-2'>Search Results</h4>
// 							<div className='max-h-60 overflow-y-auto space-y-2'>
// 								{searchResults.map((result, index) => (
// 									<div
// 										key={index}
// 										className={`flex items-center p-2 rounded hover:bg-surface cursor-pointer transition-colors ${
// 											isSelected(result) ? 'bg-muted' : ''
// 										}`}
// 										onClick={() => handleSelectResult(result)}
// 									>
// 										<img
// 											src={renderThumbnail(result)}
// 											alt='Album cover'
// 											className='w-10 h-10 rounded mr-3'
// 										/>
// 										<div className='flex-1'>
// 											<h5 className='text-sm font-medium'>
// 												{renderTitle(result)}
// 											</h5>
// 											<p className='text-xs text-gray-400'>
// 												{renderArtist(result)}
// 											</p>
// 										</div>
// 										<div>
// 											{isSelected(result) ? (
// 												<Button
// 													variant='ghost'
// 													size='icon'
// 													className='h-8 w-8 text-foreground hover:text-foreground/80'
// 												>
// 													<Check className='h-4 w-4' />
// 												</Button>
// 											) : (
// 												<Button
// 													variant='ghost'
// 													size='icon'
// 													className='h-8 w-8 text-gray-400 hover:text-white'
// 													onClick={(e) => handlePreviewPlay(result, e)}
// 												>
// 													{sourceType === 'spotify' &&
// 													isPlaying &&
// 													previewUrl ===
// 														(result as SpotifyTrack).preview_url ? (
// 														<Pause className='h-4 w-4' />
// 													) : (
// 														<Volume2 className='h-4 w-4' />
// 													)}
// 												</Button>
// 											)}
// 										</div>
// 									</div>
// 								))}
// 							</div>
// 						</div>
// 					)}

// 					{selectedResult && (
// 						<div className='bg-gray-800 rounded-lg p-3'>
// 							<h4 className='font-medium mb-2'>Selected Song</h4>
// 							{isEditing ? (
// 								<div className='space-y-2 p-2'>
// 									<div>
// 										<label className='text-xs text-gray-400'>Title</label>
// 										<Input
// 											value={customTitle}
// 											onChange={(e) => setCustomTitle(e.target.value)}
// 											className='h-8 mt-1'
// 										/>
// 									</div>
// 									<div>
// 										<label className='text-xs text-gray-400'>Artist</label>
// 										<Input
// 											value={customArtist}
// 											onChange={(e) => setCustomArtist(e.target.value)}
// 											className='h-8 mt-1'
// 										/>
// 									</div>
// 									<div className='flex justify-end'>
// 										<Button
// 											variant='outline'
// 											size='sm'
// 											onClick={handleToggleEdit}
// 										>
// 											Done
// 										</Button>
// 									</div>
// 								</div>
// 							) : (
// 								<div className='flex items-center p-2 bg-muted border border-border/30 rounded-lg'>
// 									<img
// 										src={renderThumbnail(selectedResult)}
// 										alt='Album cover'
// 										className='w-10 h-10 rounded mr-3'
// 									/>
// 									<div className='flex-1'>
// 										<div className='flex items-center'>
// 											<h5 className='text-sm font-medium text-foreground'>
// 												{customTitle}
// 											</h5>
// 											<Button
// 												variant='ghost'
// 												size='icon'
// 												className='ml-1 h-6 w-6 text-xs text-muted-foreground hover:text-foreground'
// 												onClick={handleToggleEdit}
// 											>
// 												<Pencil className='h-3 w-3' />
// 											</Button>
// 										</div>
// 										<p className='text-xs text-muted-foreground'>
// 											{customArtist}
// 										</p>
// 									</div>
// 									<div className='flex space-x-1'>
// 										{sourceType === 'spotify' && (
// 											<Button
// 												variant='ghost'
// 												size='icon'
// 												className={`h-8 w-8 ${
// 													isPlaying
// 														? 'text-primary'
// 														: 'text-gray-400 hover:text-white'
// 												}`}
// 												onClick={(e) => handlePreviewPlay(selectedResult, e)}
// 												disabled={
// 													sourceType === 'spotify' &&
// 													!searchPreviewResults?.find(
// 														(track) =>
// 															track.id === (selectedResult as SpotifyTrack).id
// 													)?.preview_url
// 												}
// 											>
// 												{isPlaying &&
// 												previewUrl ===
// 													searchPreviewResults?.find(
// 														(track) =>
// 															track.id === (selectedResult as SpotifyTrack).id
// 													)?.preview_url ? (
// 													<Pause className='h-4 w-4' />
// 												) : (
// 													<Volume2 className='h-4 w-4' />
// 												)}
// 											</Button>
// 										)}
// 										<Button
// 											variant='ghost'
// 											size='icon'
// 											className='h-8 w-8 text-gray-400 hover:text-error'
// 											onClick={() => setSelectedResult(null)}
// 										>
// 											<X className='h-4 w-4' />
// 										</Button>
// 									</div>
// 								</div>
// 							)}
// 						</div>
// 					)}
// 					{/* Hiding this section right now since it's not needed/used */}
// 					{/* <div className='flex justify-between items-end'>
// 						<div className='flex flex-col gap-2'>
// 							<div>
// 								<label className='block text-sm font-medium mb-2'>
// 									Genre Hint (Optional)
// 								</label>
// 							</div>
// 							<div>
// 								<label className='block text-xs text-gray-400 mb-1'>
// 									Enter a custom genre
// 								</label>
// 								<Input
// 									type='text'
// 									placeholder='EDM'
// 									className='w-[180px] bg-surface'
// 									value={selectedGenre}
// 									onChange={(e) => setSelectedGenre(e.target.value)}
// 								/>
// 							</div>
// 						</div>
// 					</div> */}
// 				</div>

// 				<DialogFooter>
// 					<Button
// 						variant='outline'
// 						onClick={() => onOpenChange(false)}
// 						disabled={addSongMutation.isPending}
// 					>
// 						Cancel
// 					</Button>
// 					<Button
// 						onClick={handleAddSong}
// 						disabled={!selectedResult || addSongMutation.isPending}
// 						loading={addSongMutation.isPending}
// 					>
// 						{addSongMutation.isPending ? 'Adding...' : 'Add Song'}
// 					</Button>
// 				</DialogFooter>
// 			</DialogContent>
// 		</Dialog>
// 	);
// }

// // Icons
// function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
// 	return (
// 		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
// 			<path d='M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.5917 16.5917C16.2834 16.9 15.7917 16.9 15.4834 16.5917C14.15 15.4334 12.3834 14.95 10.3167 15.4334C9.85005 15.525 9.38338 15.2167 9.29171 14.75C9.20005 14.2834 9.50838 13.8167 9.97505 13.725C12.475 13.1417 14.6667 13.725 16.3167 15.15C16.625 15.4584 16.625 15.95 16.3167 16.2584L16.5917 16.5917ZM17.6667 13.5C17.2834 13.8834 16.6667 13.8834 16.2834 13.5C14.7084 12.1584 12.3834 11.55 10.0417 12.1584C9.55838 12.2917 9.05838 12.0334 8.92505 11.55C8.79171 11.0667 9.05005 10.5667 9.53338 10.4334C12.3834 9.70837 15.1334 10.4334 17.0834 12.0334C17.4667 12.3334 17.4667 12.95 17.0834 13.3334L17.6667 13.5ZM17.8334 10.6334C15.8834 9.08337 12.475 8.82503 9.88338 9.55837C9.30838 9.70837 8.70838 9.38337 8.55838 8.8917C8.40838 8.3167 8.73338 7.7167 9.22505 7.5667C12.2 6.73337 16.0667 7.0167 18.425 8.8917C18.8834 9.2167 18.9667 9.8917 18.6417 10.35C18.3167 10.7167 17.6417 10.8 17.1834 10.475L17.8334 10.6334Z' />
// 		</svg>
// 	);
// }

// function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
// 	return (
// 		<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
// 			<path d='M21.543 6.498C22 8.28 22 12 22 12C22 12 22 15.72 21.543 17.502C21.289 18.487 20.546 19.262 19.605 19.524C17.896 20 12 20 12 20C12 20 6.107 20 4.395 19.524C3.45 19.258 2.708 18.484 2.457 17.502C2 15.72 2 12 2 12C2 12 2 8.28 2.457 6.498C2.711 5.513 3.454 4.738 4.395 4.476C6.107 4 12 4 12 4C12 4 17.896 4 19.605 4.476C20.55 4.742 21.292 5.516 21.543 6.498ZM10 15.5L16 12L10 8.5V15.5Z' />
// 		</svg>
// 	);
// }
