'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { useSSE } from '@/hooks/useSSE';
import { GameState, Message, SystemMessage } from '@/shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { RoomInfo } from '@/components/Room/Info';
import { PlayerList } from '@/components/Room/PlayerList';
// import { MusicPlayer } from '@/components/Room/MusicPlayer';
import { SongQueue } from '@/components/Room/SongQueue';
import { NavigationBar } from '@/components/NavigationBar';
import { isEmpty } from 'lodash';
import { ChatBox } from '@/components/Room/ChatBox';
import { useAxiosErrorHandler } from '@/hooks/useAxiosErrorHandler';
import { CountdownOverlay } from '@/components/Room/CountdownOverlay';
import { GamePlayer } from '@/components/Room/GamePlayer';
// FIXME: Update according to schema
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

	if (loading || isEmpty(initialState) || !user) {
		return <LoadingScreen />;
	}

	const { id } = user;

	// TODO: UPDATE MUSICPLAYER PROPS

	const {
		currentRound,
		currentTrack,
		songs,
		songsPerPlayer,
		timePerSong,
		room,
		totalRounds,
		players,
		hostId,
		isPlaying,
		currentTrackStartedAt,
	} = initialState;

	// Final check before rendering - if user somehow got past the useEffect checks
	const isUserInRoom = players.some((player) => player.user.id === user.id);
	if (!isUserInRoom) {
		router.push('/');
		return <LoadingScreen />;
	}

	// const timeLeft = () => {
	// 	const now = new Date();
	// 	const startedAt = currentTrackStartedAt
	// 		? new Date(currentTrackStartedAt)
	// 		: null;
	// 	const timeRemaining = startedAt ? now.getTime() - startedAt.getTime() : 0;
	// 	return timePerSong - timeRemaining;
	// };

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

	if (isPlaying) {
		return (
			<div>
				{countdown !== null && <CountdownOverlay countdown={countdown} />}
				<GamePlayer
					currentTrack={currentTrack}
					currentRound={currentRound}
					totalRounds={totalRounds}
					isPlaying={false}
					currentTrackStartedAt={currentTrackStartedAt}
					timePerSong={timePerSong}
				/>
				<ChatBox
					messages={initialMessages || []}
					roomCode={roomCode}
					user={currentUser}
					users={gameState?.players || []}
					isGuessing={true}
				/>
			</div>
		);
	}

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
			{countdown !== null && <CountdownOverlay countdown={countdown} />}
			<main className='flex-1 container mx-auto px-4 py-6'>
				<div className='flex flex-col lg:flex-row gap-6'>
					<div className='lg:w-1/4'>
						{initialState && (
							<>
								<RoomInfo
									room={room}
									hostUserName={''}
									currentRound={currentRound}
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
						)}
					</div>
					<div className='lg:w-2/4'>
						<GamePlayer
							currentTrack={currentTrack}
							currentRound={0}
							totalRounds={0}
							isPlaying={false}
							currentTrackStartedAt={currentTrackStartedAt}
							timePerSong={timePerSong}
						/>
						<ChatBox
							messages={initialMessages || []}
							roomCode={roomCode}
							user={currentUser}
							users={gameState?.players || []}
							isGuessing={false}
						/>
					</div>
					<div className='lg:w-1/4'>
						<SongQueue
							songQueue={songs}
							currentTrackIndex={0}
							userId={id}
							roomCode={roomCode}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
