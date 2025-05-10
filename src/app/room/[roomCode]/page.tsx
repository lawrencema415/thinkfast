'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { useSSE } from '@/hooks/useSSE';
import { GameState, Message, SystemMessage } from '@/shared/schema';
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
	const params = useParams();
	const router = useRouter();
	const roomCode = params.roomCode as string;
	const { toast } = useToast();
	const { gameState } = useSSE(roomCode);
	const { loading, user } = useAuth();
	const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
	const handleError = useAxiosErrorHandler();

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
			} catch (error) {
				router.push('/');
				handleError(error, 'Failed to fetch game state or messages');
			}
		};

		init();
	}, [handleError, roomCode, router, toast, user, gameState]);

	// Countdown effect
	useEffect(() => {
		if (gameState?.countDown) {
			setCountdown(3);
			const timer1 = setTimeout(() => setCountdown(2), 1000);
			const timer2 = setTimeout(() => setCountdown(1), 2000);
			const timer3 = setTimeout(() => setCountdown(null), 3000);
			return () => {
				clearTimeout(timer1);
				clearTimeout(timer2);
				clearTimeout(timer3);
			};
		} else {
			setCountdown(null);
		}
	}, [gameState?.countDown]);

	const countDown = gameState?.countDown;

	// Play countdown audio
	useEffect(() => {
		if (countDown) {
			if (!countdownAudioRef.current) {
				countdownAudioRef.current = new Audio('/countdown.mp3');
			}
			countdownAudioRef.current.currentTime = 0;
			countdownAudioRef.current.play();
		}
	}, [countDown]);

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
	} = initialState;

	// Final check before rendering - if user somehow got past the useEffect checks
	const isUserInRoom = players.some((player) => player.user.id === user.id);
	if (!isUserInRoom) {
		router.push('/');
		return <LoadingScreen />;
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

	const renderGame = () => {
		return (
			<div>
				<GamePlayer
					round={round}
					totalRounds={totalRounds}
					isPlaying={isPlaying}
					timePerSong={timePerSong}
				/>
				{!isPlaying && (
					<ChatBox
						isGuessing={false}
						messages={initialMessages || []}
						roomCode={roomCode}
						user={currentUser}
						users={gameState?.players || []}
						round={round}
						timePerSong={timePerSong}
					/>
				)}
			</div>
		);
	};

	const roomInfo = () => {
		if (isPlaying && currentTrack) {
			return (
				<PlayerList
					players={players || []}
					hostId={hostId}
					songsPerPlayer={songsPerPlayer}
					userId={user.id}
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
					userId={user.id}
					songs={songs}
				/>
				<PlayerList
					players={players || []}
					hostId={hostId}
					songsPerPlayer={songsPerPlayer}
					userId={user.id}
					roomCode={roomCode}
				/>
			</>
		);
	};

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
			{countdown !== null && <CountdownOverlay countdown={countdown} />}
			<main className='flex-1 container mx-auto px-4 py-6'>
				<div className='flex flex-col lg:flex-row gap-6'>
					<div className='lg:w-1/4'>{initialState && roomInfo()}</div>
					<div className='lg:w-2/4'>{renderGame()}</div>
					<div className='lg:w-1/4'>
						{isPlaying ? (
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
						) : (
							<SongQueue songQueue={songs} userId={id} roomCode={roomCode} />
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
