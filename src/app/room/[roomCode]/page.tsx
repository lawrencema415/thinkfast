'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { useSSE } from '@/hooks/useSSE';
import { GameState, Message, SystemMessage, Round } from '@/shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { RoomInfo } from '@/components/Room/Info';
import { PlayerList } from '@/components/Room/PlayerList';
import { SongQueue } from '@/components/Room/SongQueue';
import { NavigationBar } from '@/components/NavigationBar';
import { isEmpty } from 'lodash';
import { ChatBox } from '@/components/Room/ChatBox';
import { useAxiosErrorHandler } from '@/hooks/useAxiosErrorHandler';
import { CountdownOverlay } from '@/components/Room/CountdownOverlay';
import { GamePlayer } from '@/components/Room/GamePlayer';

export default function RoomPage() {
	const [initialState, setInitialState] = useState<GameState | null>(null);
	const [initialMessages, setInitialMessages] = useState<
		(SystemMessage | Message)[]
	>([]);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [optimisticRound, setOptimisticRound] = useState<Round | null>(null);
	const [optimisticIsPlaying, setOptimisticIsPlaying] = useState(false);

	const params = useParams();
	const router = useRouter();
	const roomCode = params.roomCode as string;
	const { toast } = useToast();
	const { gameState } = useSSE(roomCode);
	const { loading, user } = useAuth();
	const handleError = useAxiosErrorHandler();
	const searchParams = useSearchParams();
	const isJoining = searchParams.get('joining') === '1';

	// Initial fetch for SSR fallback
	useEffect(() => {
		const init = async () => {
			if (!user) return;

			try {
				const [gameStateResponse, messagesResponse] = await Promise.all([
					axios.get(`/api/game/state?roomCode=${roomCode}`),
					axios.get(`/api/game/messages?roomCode=${roomCode}`),
				]);
				const gameState: GameState = gameStateResponse.data.gameState;
				const messages: (SystemMessage | Message)[] =
					messagesResponse.data.messages;

				setInitialState(gameState);
				setInitialMessages(messages);
				const isUserInRoom = gameState.players.some(
					(player) => player.user.id === user.id
				);
				if (isUserInRoom && isJoining) {
					const url = new URL(window.location.href);
					url.searchParams.delete('joining');
					router.replace(url.pathname + url.search);
				}
			} catch (error) {
				router.push('/');
				handleError(error, 'Failed to fetch game state or messages');
			}
		};

		init();
	}, [handleError, roomCode, router, toast, user, isJoining]);

	// Countdown effect and precise round start
	useEffect(() => {
		if (gameState?.countDown && gameState?.nextRound) {
			setCountdown(3);
			setOptimisticRound(gameState.nextRound);
			setOptimisticIsPlaying(false);

			const now = Date.now();
			const roundStart = new Date(gameState.nextRound.startedAt).getTime();
			const msUntilStart = Math.max(0, roundStart - now);

			const timer1 = setTimeout(() => setCountdown(2), 1000);
			const timer2 = setTimeout(() => setCountdown(1), 2000);
			const timer3 = setTimeout(() => setCountdown(null), 3000);

			const playTimer = setTimeout(() => {
				setOptimisticIsPlaying(true);
			}, msUntilStart);

			return () => {
				clearTimeout(timer1);
				clearTimeout(timer2);
				clearTimeout(timer3);
				clearTimeout(playTimer);
			};
		} else {
			setCountdown(null);
			setOptimisticRound(null);
			setOptimisticIsPlaying(false);
		}
	}, [gameState?.countDown, gameState?.nextRound]);

	// Reset optimistic state when real round arrives
	useEffect(() => {
		if (gameState?.isPlaying && gameState?.round) {
			setOptimisticIsPlaying(false);
			setOptimisticRound(null);
		}
	}, [gameState?.isPlaying, gameState?.round]);

	// Play countdown audio
	// useEffect(() => {
	// 	if (countdown !== null) {
	// 		if (!countdownAudioRef.current) {
	// 			countdownAudioRef.current = new Audio('/countdown.mp3');
	// 		}
	// 		countdownAudioRef.current.currentTime = 0;
	// 		countdownAudioRef.current.play();
	// 	}
	// }, [countdown]);

	if (loading || isEmpty(initialState) || !user) {
		return <LoadingScreen />;
	}

	const { id } = user;
	const {
		songs,
		songsPerPlayer,
		timePerSong,
		room,
		totalRounds,
		players,
		hostId,
		isPlaying,
		round,
	} = gameState || initialState;

	// Final check before rendering - if user somehow got past the useEffect checks
	const isUserInRoom = players.some((player) => player.user.id === user.id);
	if (!isUserInRoom) {
		if (isJoining) {
			// Show spinner, don't redirect
			return <LoadingScreen />;
		} else {
			router.push('/');
			return <LoadingScreen />;
		}
	}

	const currentUser = players.find((player) => player.user.id === id);

	if (!currentUser || !isUserInRoom) {
		router.push('/');
		toast({
			title: 'Access denied',
			description: 'You are not in this room',
			variant: 'destructive',
			duration: 3000,
		});
		return;
	}

	const currentTrack = round?.song;

	// --- RENDER LOGIC FOR GAME FLOW ---

	// 1. Show countdown overlay if active
	if (countdown !== null) {
		return (
			<div className='min-h-screen flex flex-col'>
				<NavigationBar />
				<CountdownOverlay
					key={optimisticRound?.id || 'countdown'}
					countdown={countdown}
				/>
				<main className='flex-1 container mx-auto px-4 py-6'>
					<div className='flex flex-col lg:flex-row gap-6'>
						<div className='lg:w-1/4'>{roomInfo(false)}</div>
						<div className='lg:w-2/4'>
							{optimisticRound && (
								<GamePlayer
									round={optimisticRound}
									totalRounds={totalRounds}
									isPlaying={false}
									timePerSong={timePerSong}
									disabled // disable input during countdown
								/>
							)}
						</div>
						<div className='lg:w-1/4'>
							<SongQueue songQueue={songs} userId={id} roomCode={roomCode} />
						</div>
					</div>
				</main>
			</div>
		);
	}

	// 2. Optimistically show round UI if local time >= startedAt and SSE hasn't updated yet
	if (optimisticIsPlaying && optimisticRound) {
		return (
			<div className='min-h-screen flex flex-col'>
				<NavigationBar />
				<main className='flex-1 container mx-auto px-4 py-6'>
					<div className='flex flex-col lg:flex-row gap-6'>
						<div className='lg:w-1/4'>{roomInfo(true)}</div>
						<div className='lg:w-2/4'>
							<GamePlayer
								round={optimisticRound}
								totalRounds={totalRounds}
								isPlaying={true}
								timePerSong={timePerSong}
							/>
						</div>
						<div className='lg:w-1/4'>
							<ChatBox
								messages={initialMessages || []}
								timePerSong={timePerSong}
								roomCode={roomCode}
								user={currentUser}
								users={gameState?.players || []}
								isGuessing={true}
								round={optimisticRound}
								currentTrack={optimisticRound.song}
							/>
						</div>
					</div>
				</main>
			</div>
		);
	}

	// 3. Show the real round/game UI when isPlaying and round are present
	if (isPlaying && round) {
		return (
			<div className='min-h-screen flex flex-col'>
				<NavigationBar />
				<main className='flex-1 container mx-auto px-4 py-6'>
					<div className='flex flex-col lg:flex-row gap-6'>
						<div className='lg:w-1/4'>{roomInfo(true)}</div>
						<div className='lg:w-2/4'>
							<GamePlayer
								round={round}
								totalRounds={totalRounds}
								isPlaying={isPlaying}
								timePerSong={timePerSong}
							/>
						</div>
						<div className='lg:w-1/4'>
							<ChatBox
								messages={initialMessages || []}
								timePerSong={timePerSong}
								roomCode={roomCode}
								user={currentUser}
								users={gameState?.players || []}
								isGuessing={true}
								round={round}
								currentTrack={currentTrack}
							/>
						</div>
					</div>
				</main>
			</div>
		);
	}

	// 4. If isPlaying but no round yet, show waiting message
	if (isPlaying && !round) {
		return (
			<div className='min-h-screen flex flex-col'>
				<NavigationBar />
				<main className='flex-1 container mx-auto px-4 py-6 flex items-center justify-center'>
					<div className='text-lg text-muted-foreground'>
						Waiting for host to start the round...
					</div>
				</main>
			</div>
		);
	}

	// 5. Default: show lobby/room info and song queue
	function roomInfo(isGame: boolean) {
		if (isGame) {
			return (
				<PlayerList
					players={players || []}
					hostId={hostId}
					songsPerPlayer={songsPerPlayer}
					userId={id}
					roomCode={roomCode}
				/>
			);
		}
		return (
			<>
				<RoomInfo
					room={room}
					hostUserName={''}
					totalRounds={totalRounds}
					songsPerPlayer={songsPerPlayer}
					timePerSong={timePerSong}
					hostId={hostId}
					userId={id}
					songs={songs}
				/>
				<PlayerList
					players={players || []}
					hostId={hostId}
					songsPerPlayer={songsPerPlayer}
					userId={id}
					roomCode={roomCode}
				/>
			</>
		);
	}

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
			<main className='flex-1 container mx-auto px-4 py-6'>
				<div className='flex flex-col lg:flex-row gap-6'>
					<div className='lg:w-1/4'>{roomInfo(false)}</div>
					<div className='lg:w-2/4'>
						{(!isPlaying || !optimisticIsPlaying) && (
							<ChatBox
								messages={initialMessages || []}
								timePerSong={timePerSong}
								roomCode={roomCode}
								user={currentUser}
								users={gameState?.players || []}
								isGuessing={false}
								round={null}
								currentTrack={null}
							/>
						)}
					</div>
					<div className='lg:w-1/4'>
						<SongQueue songQueue={songs} userId={id} roomCode={roomCode} />
					</div>
				</div>
			</main>
		</div>
	);
}
