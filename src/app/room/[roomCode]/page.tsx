'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
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

// FIXME: Update according to schema
export default function RoomPage() {
	const [initialState, setInitialState] = useState<GameState | null>(null);
	const params = useParams();
	const roomCode = params.roomCode as string;
	const { toast } = useToast();
	const { gameState } = useSSE(roomCode);
	const { loading, user } = useAuth();

	useEffect(() => {
		if (gameState) {
			setInitialState(gameState);
		}
		console.log('gameState when SSE', gameState);
	}, [gameState]);

	useEffect(() => {
		const fetchGameState = async () => {
			try {
				const response = await axios.get(
					`/api/game/state?roomCode=${roomCode}`
				);
				setInitialState(response.data.gameState);
			} catch (error) {
				console.error('Error fetching game state:', error);
				toast({
					title: 'Error',
					description: 'Failed to fetch game state',
					variant: 'destructive',
				});
			}
		};

		fetchGameState();
	}, [roomCode, toast]);

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
	} = initialState;

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
								/>
								<PlayerList
									players={players || []}
									hostId={hostId}
									songsPerPlayer={songsPerPlayer}
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
						<SongQueue songQueue={songs} currentTrackIndex={0} userId={id} />
					</div>
				</div>
			</main>
		</div>
	);
}
