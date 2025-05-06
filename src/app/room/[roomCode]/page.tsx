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
import { NavigationBar } from '@/components/navigation-bar';
import { isEmpty } from 'lodash';
import { ChatBox } from '@/components/Room/ChatBox';

export default function RoomPage() {
	const [initialState, setInitialState] = useState<GameState | null>(null);
	const params = useParams();
	const roomCode = params.roomCode as string;
	const { toast } = useToast();
	const { gameState } = useSSE(roomCode);
	const { loading } = useAuth();

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

	if (loading || isEmpty(initialState)) {
		return <LoadingScreen />;
	}

	console.log('initialState', initialState);

	// TODO: UPDATE MUSICPLAYER PROPS

	return (
		<div className='min-h-screen flex flex-col'>
			<NavigationBar />
			<main className='flex-1 container mx-auto px-4 py-6'>
				<div className='flex flex-col lg:flex-row gap-6'>
					<div className='lg:w-1/4'>
						{initialState && (
							<>
								<RoomInfo
									room={initialState.room}
									hostUserName={''}
									currentRound={0}
									totalRounds={0}
								/>
								<PlayerList
									players={initialState.room.players || []}
									hostId={initialState.room.hostId}
									songsPerPlayer={initialState.room.songsPerPlayer}
								/>
							</>
						)}
					</div>
					<div className='lg:w-2/4'>
						<MusicPlayer
							currentTrack={null}
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
							messages={gameState?.messages || []}
							roomCode={roomCode}
							users={initialState.players || []}
							onSendMessage={() => {}}
						/>
					</div>
					<div className='lg:w-1/4'>
						<SongQueue songQueue={[]} currentTrackIndex={0} submitters={{}} />
					</div>
				</div>
			</main>
		</div>
	);
}
