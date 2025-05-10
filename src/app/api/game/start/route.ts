import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';
import { Player, Song, Round } from '@/shared/schema';

const ADDED_TIME_TO_ROUND = 3000;
const REVEAL_PERCENTAGE = 20;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateHash(text: string, revealPercentage: number): string {
  if (!text) return '';

  const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';

  let hash = '';
  for(let i = 0; i < text.length; i++) {
    const num = Math.random() * 100;
    if (num > revealPercentage && alphanumeric.includes(text[i].toLowerCase())){
      hash += '_'
    } else {
      hash += text[i];
    }
  }

  return hash;
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
  gameState.totalRounds = totalRounds;
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
  let index = 1;
  for (let i = 0; i < songs.length; i++) {
    // Set up round
    let gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) return;

    const round: Round = {
      id: crypto.randomUUID(),
      roundNumber: index,
      song: songs[i],
      startedAt: new Date(),
      hash: generateHash(songs[i].title, REVEAL_PERCENTAGE),
      guesses: [],
      winnerId: null
    }

    gameState.countDown = false;
    gameState.isPlaying = true;
    gameState.round = round
    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    // Wait for the song's timePerSong duration
    await delay(timePerSong * 1000 + ADDED_TIME_TO_ROUND);

    // If this is the last song, end the game after this round
    if (i === songs.length - 1) {
      // End game, reset state
      gameState = await storage.getGameStateByRoomCode(roomCode);
      if (!gameState) return;
      gameState.isPlaying = false;
      gameState.countDown = false;
      // gameState.songs = []; // TURNED OFF FOR DEV, DONT WANT TO REFETCH
      gameState.round = null;
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

    index++;
  }
}
