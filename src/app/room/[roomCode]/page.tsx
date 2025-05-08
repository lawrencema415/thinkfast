'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { useSSE } from '@/hooks/useSSE';
import { GameState } from '@/shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { RoomInfo } from '@/components/Room/Info';
import { PlayerList } from '@/components/Room/PlayerList';
import { MusicPlayer } from '@/components/Room/MusicPlayer';
import { SongQueue } from '@/components/Room/SongQueue';
import { NavigationBar } from '@/components/NavigationBar';
import { isEmpty } from 'lodash';
import { ChatBox } from '@/components/Room/ChatBox';
import { useAxiosErrorHandler } from '@/hooks/useAxiosErrorHandler';

// FIXME: Update according to schema
export default function RoomPage() {
	const [initialState, setInitialState] = useState<GameState | null>(null);
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
				const response = await axios.get(
					`/api/game/state?roomCode=${roomCode}`
				);
				const gameState: GameState = response.data.gameState;

				const isUserInRoom = gameState.players?.some(
					(player) => player.user.id === user.id
				);

				if (!isUserInRoom) {
					router.push('/');
					toast({
						title: 'Access denied',
						description: 'You are not in this room',
						variant: 'destructive',
						duration: 3000,
					});
					return;
				}

				setInitialState(gameState);
			} catch (error) {
				router.push('/');
				handleError(error, 'Failed to fetch game state');
			}
		};

		init();
	}, [handleError, roomCode, router, toast, user, gameState]);

	if (loading || isEmpty(initialState) || !user) {
		return <LoadingScreen />;
	}

	const { id } = user;

	// TODO: UPDATE MUSICPLAYER PROPS

	const {
		currentRound,
		currentTrack,
		songs,
		messages,
		songsPerPlayer,
		timePerSong,
		room,
		totalRounds,
		players,
		hostId,
		isPlaying,
	} = initialState;

	// Final check before rendering - if user somehow got past the useEffect checks
	const isUserInRoom = players.some((player) => player.user.id === user.id);
	if (!isUserInRoom) {
		router.push('/');
		return <LoadingScreen />;
	}

	if (isPlaying) {
		return <div>Started!</div>;
	}

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
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
						<MusicPlayer
							currentTrack={currentTrack}
							submitter={null}
							currentRound={0}
							totalRounds={0}
							isPlaying={false}
							timeRemaining={0}
							onPlayPause={function (): void {
								throw new Error('Function not implemented.');
							}}
						/>
						<ChatBox
							messages={messages || []}
							roomCode={roomCode}
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
