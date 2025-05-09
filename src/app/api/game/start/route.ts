import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';
import { Player, Song } from '@/shared/schema';

const ADDED_TIME_TO_ROUND = 10000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();
  if (!user) return response;
  const body = await req.json();
  const { roomCode, songsPerPlayer, timePerSong } = body;

  const gameState = await storage.getGameStateByRoomCode(roomCode);
  const roomId = await storage.getRoomByCode(roomCode);

  if (!roomId) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  if (!gameState) {
    return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
  }
  const player = gameState.players.find((p: Player) => p.user.id === user.id);
  if (player?.user.id !== gameState.hostId) {
    return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
  }
  if (gameState.isPlaying) {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  }

  // Set game settings
  if (typeof songsPerPlayer === 'number') gameState.songsPerPlayer = songsPerPlayer;
  if (typeof timePerSong === 'number') gameState.timePerSong = timePerSong;

  // Shuffle songs and set up rounds
  await storage.shuffleSongsInRoom(roomCode);
  const songs: Song[] = (await storage.getGameStateByRoomCode(roomCode))?.songs || [];
  const totalRounds = songs.length;

  // Start countdown
  gameState.countDown = true;
  gameState.isPlaying = false;
  gameState.currentRound = 0;
  gameState.currentTrack = null;
  gameState.currentTrackStartedAt = null;
  gameState.rounds = [];
  gameState.totalRounds = totalRounds;
  gameState.timeRemaining = timePerSong;
  await storage.saveGameState(roomId, gameState);
  await broadcastGameState(roomCode, storage);

  // Wait 3 seconds for countdown
  setTimeout(async () => {
    await startGameRounds(roomCode, roomId, timePerSong, songs);
  }, 3000);

  return NextResponse.json(gameState.room);
}

// Helper to run the game rounds
async function startGameRounds(
  roomCode: string,
  roomId: string,
  timePerSong: number,
  songs: Song[]
) {
  let round = 1;
  for (let i = 0; i < songs.length; i++) {
    // Set up round
    let gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) return;

    gameState.countDown = false;
    gameState.isPlaying = true;
    gameState.currentRound = round;
    gameState.currentTrack = songs[i];
    gameState.currentTrackStartedAt = new Date();
    gameState.timeRemaining = timePerSong + ADDED_TIME_TO_ROUND;
    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    // Wait for the song's timePerSong duration
    await delay(timePerSong * 1000);

    // If this is the last song, end the game after this round
    if (i === songs.length - 1) {
      // End game, reset state
      gameState = await storage.getGameStateByRoomCode(roomCode);
      if (!gameState) return;
      gameState.isPlaying = false;
      gameState.countDown = false;
      gameState.currentTrack = null;
      gameState.currentTrackStartedAt = null;
      gameState.currentRound = 0;
      // gameState.songs = []; 
      gameState.rounds = [];
      await storage.saveGameState(roomId, gameState);
      await broadcastGameState(roomCode, storage);
      return;
    }

    // 3s countdown before next round
    gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) return;
    gameState.countDown = true;
    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    await delay(3000); // 3s interval

    round++;
  }
}
