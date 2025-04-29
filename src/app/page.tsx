'use client';

import { useSSE } from '@/hooks/useSSE';
import { useEffect, useState } from 'react';

import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { NavigationBar } from '@/components/navigation-bar';
import { Footer } from '@/components/footer';
import { useGame } from '@/hooks/use-game';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from '@/components/ui/form';
import { MusicWave } from '@/components/ui/music-wave';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Users, Clock, Plus, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useWebSocket, useWebSocketListener } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@shared/schema';
import { ReadyToPlayModal } from '@/components/ready-to-play-modal';

// Room creation form schema
const createRoomSchema = z.object({
	songsPerPlayer: z.number().min(1).max(5),
	timePerSong: z.number().min(5).max(15),
});

// Join room form schema
const joinRoomSchema = z.object({
	roomCode: z.string().min(4).max(10),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;
type JoinRoomFormValues = z.infer<typeof joinRoomSchema>;

// Move to constants file if needed in future
const DEFAULT_SONGS_PER_PLAYER = 3;
const DEFAULT_SECONDS_PER_SONG = 10;
const MIN_SECONDS_PER_SONG = 5;
const MAX_SECONDS_PER_SONG = 15;
const MIN_SONGS_PER_PLAYER = 1;
const MAX_SONGS_PER_PLAYER = 5;

export default function HomePage() {
	const { user } = useAuth();
	const { createRoomMutation, joinRoomMutation } = useGame();
	const [activeTab, setActiveTab] = useState<string>('create');
	const { sendMessage, connected } = useWebSocket();
	const { toast } = useToast();
	const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
	const [showReadyToPlayModal, setShowReadyToPlayModal] = useState(false);
	const router = useRouter();

	// Listen for JOINED_ROOM response
	useWebSocketListener('JOINED_ROOM', (payload: { roomId: string }) => {
		if (joiningRoom) {
			router.push(`/room/${joiningRoom}`);
		}
	});

	// Create room form
	const createRoomForm = useForm<CreateRoomFormValues>({
		resolver: zodResolver(createRoomSchema),
		defaultValues: {
			songsPerPlayer: DEFAULT_SONGS_PER_PLAYER,
			timePerSong: DEFAULT_SECONDS_PER_SONG,
		},
	});

	// Join room form
	const joinRoomForm = useForm<JoinRoomFormValues>({
		resolver: zodResolver(joinRoomSchema),
		defaultValues: {
			roomCode: '',
		},
	});

	const onCreateRoomSubmit = (data: CreateRoomFormValues) => {
		createRoomMutation.mutate(data, {
			onSuccess: (room: Room) => {
				navigate(`/room/${room.code}`);
			},
		});
	};

	const onJoinRoomSubmit = (data: JoinRoomFormValues) => {
		setJoiningRoom(data.roomCode);
		joinRoomMutation.mutate(data.roomCode);
	};

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />

			<main className='flex-1'>
				{/* Hero Section */}
				<section className='bg-gradient-to-br from-primary/20 via-dark to-secondary/20 py-16 md:py-24'>
					<div className='container mx-auto px-4 text-center'>
						<h1 className='text-4xl md:text-6xl font-heading font-bold mb-6'>
							<span className='text-primary'>Think</span>
							<span className='text-white'>Fast</span>
						</h1>
						<p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto'>
							The ultimate multiplayer music guessing game. Who among you knows
							the latest music best?
						</p>
						<div className='flex justify-center mb-10'>
							<MusicWave className='h-16' />
						</div>
						<Button
							size='lg'
							className='text-lg px-8'
							onClick={() => setShowReadyToPlayModal(true)}
						>
							Start Playing <ChevronRight className='ml-2 h-5 w-5' />
						</Button>
					</div>
				</section>

				{/* How to Play Section */}
				<section id='game-section' className='py-16 md:py-24 bg-dark'>
					<div className='container mx-auto px-4'>
						<h2 className='text-3xl font-heading font-bold text-center mb-12'>
							How to Play
						</h2>
						<div className='grid md:grid-cols-3 gap-8'>
							<Card className='bg-gray-800 border-gray-700'>
								<CardHeader>
									<div className='bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
										<Music className='h-6 w-6 text-primary' />
									</div>
									<CardTitle>1. Create or Join a Room</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-gray-300'>
										Start a new room and invite friends with a room code, or
										join an existing room to play together.
									</p>
								</CardContent>
							</Card>

							<Card className='bg-gray-800 border-gray-700'>
								<CardHeader>
									<div className='bg-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
										<Plus className='h-6 w-6 text-secondary' />
									</div>
									<CardTitle>2. Add Your Songs</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-gray-300'>
										Each player adds 2-5 songs from Spotify or YouTube. These
										become the tracks everyone will try to guess.
									</p>
								</CardContent>
							</Card>

							<Card className='bg-gray-800 border-gray-700'>
								<CardHeader>
									<div className='bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center mb-4'>
										<Headphones className='h-6 w-6 text-accent' />
									</div>
									<CardTitle>3. Guess and Score</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-gray-300'>
										Listen to song snippets and type guesses in the chat. Faster
										correct guesses earn more points!
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</section>

				{/* Game Section */}
				<section
					id='game-section'
					className='py-16 bg-gradient-to-br from-dark via-dark to-gray-800'
				>
					<div className='container mx-auto px-4'>
						<h2 className='text-3xl font-heading font-bold text-center mb-12'>
							Ready to Play?
						</h2>

						<div className='max-w-md mx-auto'>
							<Tabs value={activeTab} onValueChange={setActiveTab}>
								<TabsList className='grid w-full grid-cols-2 mb-6'>
									<TabsTrigger value='create'>Create Room</TabsTrigger>
									<TabsTrigger value='join'>Join Room</TabsTrigger>
								</TabsList>

								<TabsContent value='create'>
									<Card className='border-gray-700 bg-gray-800'>
										<CardHeader>
											<CardTitle>Create a New Room</CardTitle>
											<CardDescription>
												Set up a room and invite friends to play
											</CardDescription>
										</CardHeader>
										<CardContent>
											<Form {...createRoomForm}>
												<form
													onSubmit={createRoomForm.handleSubmit(
														onCreateRoomSubmit
													)}
													className='space-y-6'
												>
													<FormField
														control={createRoomForm.control}
														name='songsPerPlayer'
														render={({ field }) => (
															<FormItem>
																<FormLabel>Songs Per Player</FormLabel>
																<div className='flex items-center space-x-4'>
																	<Users className='h-5 w-5 text-gray-400' />
																	<FormControl>
																		<Input
																			type='number'
																			min={MIN_SONGS_PER_PLAYER}
																			max={MAX_SONGS_PER_PLAYER}
																			className='bg-gray-700'
																			{...field}
																			onChange={(e) => {
																				const value = e.target.value;
																				field.onChange(
																					value === ''
																						? ''
																						: parseInt(value) || 0
																				);
																			}}
																			onBlur={(e) => {
																				const value = parseInt(e.target.value);
																				field.onChange(
																					!value
																						? MIN_SONGS_PER_PLAYER
																						: Math.max(
																								MIN_SONGS_PER_PLAYER,
																								Math.min(
																									MAX_SONGS_PER_PLAYER,
																									value
																								)
																						  )
																				);
																			}}
																		/>
																	</FormControl>
																</div>
																<FormDescription>
																	Each player can add 1-5 songs
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={createRoomForm.control}
														name='timePerSong'
														render={({ field }) => (
															<FormItem>
																<FormLabel>Seconds Per Song</FormLabel>
																<div className='flex items-center space-x-4'>
																	<Clock className='h-5 w-5 text-gray-400' />
																	<FormControl>
																		<Input
																			type='number'
																			min={MIN_SECONDS_PER_SONG}
																			max={MAX_SECONDS_PER_SONG}
																			className='bg-gray-700'
																			{...field}
																			onChange={(e) => {
																				const value = e.target.value;
																				field.onChange(
																					value === ''
																						? ''
																						: parseInt(value) || 0
																				);
																			}}
																			onBlur={(e) => {
																				const value = parseInt(e.target.value);
																				field.onChange(
																					!value
																						? MIN_SECONDS_PER_SONG
																						: Math.max(
																								MIN_SECONDS_PER_SONG,
																								Math.min(
																									MAX_SECONDS_PER_SONG,
																									value
																								)
																						  )
																				);
																			}}
																		/>
																	</FormControl>
																</div>
																<FormDescription>
																	How long each song plays (5-15 seconds)
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>

													<Button
														type='submit'
														className='w-full'
														disabled={createRoomMutation.isPending}
													>
														{createRoomMutation.isPending
															? 'Creating Room...'
															: 'Create Room'}
													</Button>
												</form>
											</Form>
										</CardContent>
									</Card>
								</TabsContent>

								<TabsContent value='join'>
									<Card className='border-gray-700 bg-gray-800'>
										<CardHeader>
											<CardTitle>Join an Existing Room</CardTitle>
											<CardDescription>
												Enter a room code to join a game
											</CardDescription>
										</CardHeader>
										<CardContent>
											<Form {...joinRoomForm}>
												<form
													onSubmit={joinRoomForm.handleSubmit(onJoinRoomSubmit)}
													className='space-y-6'
												>
													<FormField
														control={joinRoomForm.control}
														name='roomCode'
														render={({ field }) => (
															<FormItem>
																<FormLabel>Room Code</FormLabel>
																<FormControl>
																	<Input
																		placeholder='Enter room code'
																		className='bg-gray-700 uppercase'
																		{...field}
																		onChange={(e) =>
																			field.onChange(
																				e.target.value.toUpperCase()
																			)
																		}
																	/>
																</FormControl>
																<FormDescription>
																	Ask the room creator for this code
																</FormDescription>
																<FormMessage />
															</FormItem>
														)}
													/>

													<Button
														type='submit'
														className='w-full'
														disabled={joinRoomMutation.isPending}
													>
														{joinRoomMutation.isPending
															? 'Joining Room...'
															: 'Join Room'}
													</Button>
												</form>
											</Form>
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className='py-16 bg-dark'>
					<div className='container mx-auto px-4'>
						<h2 className='text-3xl font-heading font-bold text-center mb-12'>
							Game Features
						</h2>
						<div className='grid md:grid-cols-2 gap-12'>
							<div>
								<h3 className='text-xl font-heading font-bold mb-4 text-primary'>
									Music Sources
								</h3>
								<p className='text-gray-300 mb-4'>
									Play songs from both Spotify and YouTube. We integrate with
									these platforms to give you access to millions of tracks.
								</p>
								<Separator className='my-6 bg-gray-700' />

								<h3 className='text-xl font-heading font-bold mb-4 text-primary'>
									Real-time Gameplay
								</h3>
								<p className='text-gray-300 mb-4'>
									Experience seamless multiplayer action with our real-time
									WebSocket connection. Chat, guess, and see scores update
									instantly.
								</p>
							</div>

							<div>
								<h3 className='text-xl font-heading font-bold mb-4 text-secondary'>
									Scoring System
								</h3>
								<p className='text-gray-300 mb-4'>
									Earn points based on how quickly you guess each song. The
									faster you guess, the more points you&apos;ll earn!
								</p>
								<Separator className='my-6 bg-gray-700' />

								<h3 className='text-xl font-heading font-bold mb-4 text-secondary'>
									Customizable Rooms
								</h3>
								<p className='text-gray-300 mb-4'>
									Create rooms with your own settings. Choose how many songs
									each player contributes and how long each song plays.
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>

			<Footer />

			<ReadyToPlayModal
				isOpen={showReadyToPlayModal}
				onOpenChange={setShowReadyToPlayModal}
			/>
		</div>
	);
}

function Headphones(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns='http://www.w3.org/2000/svg'
			width='24'
			height='24'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3' />
		</svg>
	);
}

// export default function Home() {
// 	const { isConnected, messages, sendMessage } = useSSE();
// 	const [inputMessage, setInputMessage] = useState('Hello SSE!');

// 	// Add this to debug messages
// 	useEffect(() => {
// 		console.log('Current messages:', messages);
// 	}, [messages]);

// 	const handleSendMessage = () => {
// 		if (inputMessage.trim()) {
// 			console.log('Sending message:', inputMessage);
// 			sendMessage(inputMessage);
// 			setInputMessage(''); // Clear input after sending
// 		}
// 	};

// 	return (
// 		<main className='flex min-h-screen flex-col items-center justify-between p-24'>
// 			<div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
// 				<h1 className='text-4xl font-bold mb-4'>Server-Sent Events Test</h1>

// 				<div className='mb-4 p-2 rounded bg-gray-100'>
// 					Status:{' '}
// 					{isConnected ? (
// 						<span className='text-green-600 font-bold'>Connected</span>
// 					) : (
// 						<span className='text-red-600 font-bold'>Disconnected</span>
// 					)}
// 				</div>

// 				<div className='flex gap-2 mb-4'>
// 					<input
// 						type='text'
// 						value={inputMessage}
// 						onChange={(e) => setInputMessage(e.target.value)}
// 						className='flex-grow p-2 border rounded'
// 						placeholder='Type a message...'
// 						onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
// 					/>
// 					<button
// 						className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
// 						onClick={handleSendMessage}
// 					>
// 						Send Message
// 					</button>
// 				</div>

// 				<div className='mt-4 p-4 border rounded bg-white'>
// 					<h2 className='text-2xl mb-2'>Messages:</h2>
// 					{messages.length === 0 ? (
// 						<p className='text-gray-500 italic'>No messages yet</p>
// 					) : (
// 						<ul className='space-y-2'>
// 							{messages.map((msg, index) => (
// 								<li key={index} className='p-2 bg-gray-50 rounded'>
// 									{typeof msg === 'string' ? msg : JSON.stringify(msg)}
// 								</li>
// 							))}
// 						</ul>
// 					)}
// 					<p className='mt-2 text-gray-500'>
// 						Total messages: {messages.length}
// 					</p>
// 				</div>
// 			</div>
// 		</main>
// 	);
// }
