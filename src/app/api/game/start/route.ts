import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';
import { Player, Song, Round } from '@/shared/schema';

const ADDED_TIME_TO_ROUND = 3000; // 3s between rounds
const REVEAL_PERCENTAGE = 20;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateHash(text: string, revealPercentage: number): string {
  if (!text) return '';
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < text.length; i++) {
    const num = Math.random() * 100;
    if (num > revealPercentage && alphanumeric.includes(text[i].toLowerCase())) {
      hash += '_';
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

  // Calculate first nextRound's startedAt (3s from now)
  const now = new Date();
  const lastRoundStart = new Date(now.getTime() + ADDED_TIME_TO_ROUND);

  const firstNextRound: Round = {
    id: crypto.randomUUID(),
    roundNumber: 1,
    song: songs[0],
    startedAt: lastRoundStart,
    hash: generateHash(songs[0].title, REVEAL_PERCENTAGE),
    guesses: [],
    winnerId: null,
  };

  // Start countdown and pre-broadcast nextRound
  gameState.countDown = true;
  gameState.isPlaying = false;
  gameState.totalRounds = totalRounds;
  gameState.nextRound = firstNextRound;
  gameState.round = null;
  await storage.saveGameState(roomId, gameState);
  await broadcastGameState(roomCode, storage);

  // Wait 3 seconds for countdown, then start rounds
  setTimeout(async () => {
    await startGameRounds(roomCode, roomId, timePerSong, songs, lastRoundStart);
  }, ADDED_TIME_TO_ROUND);

  return NextResponse.json(gameState.room);
}

// Helper to run the game rounds with pre-broadcasted nextRound
async function startGameRounds(
  roomCode: string,
  roomId: string,
  timePerSong: number,
  songs: Song[],
  initialStart: Date
) {
  let lastRoundStart = initialStart;

  for (let i = 0; i < songs.length; i++) {
    // 1. Move nextRound to round, set isPlaying = true, clear nextRound
    let gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) return;

    const round: Round = {
      ...(gameState.nextRound || {
        id: crypto.randomUUID(),
        roundNumber: i + 1,
        song: songs[i],
        startedAt: lastRoundStart,
        hash: generateHash(songs[i].title, REVEAL_PERCENTAGE),
        guesses: [],
        winnerId: null,
      }),
      startedAt: lastRoundStart,
    };

    gameState.countDown = false;
    gameState.isPlaying = true;
    gameState.round = round;
    gameState.nextRound = null;
    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    // 2. Wait for the song's timePerSong duration
    await delay(timePerSong * 1000 + ADDED_TIME_TO_ROUND);

    // 3. If this is the last song, end the game after this round
    if (i === songs.length - 1) {
      gameState = await storage.getGameStateByRoomCode(roomCode);
      if (!gameState) return;
      gameState.isPlaying = false;
      gameState.countDown = false;
      gameState.round = null;
      gameState.nextRound = null;
      await storage.saveGameState(roomId, gameState);
      await broadcastGameState(roomCode, storage);
      return;
    }

    // 4. Pre-broadcast the next round and start countdown
    lastRoundStart = new Date(
      lastRoundStart.getTime() + timePerSong * 1000 + ADDED_TIME_TO_ROUND
    );
    const nextRound: Round = {
      id: crypto.randomUUID(),
      roundNumber: i + 2,
      song: songs[i + 1],
      startedAt: lastRoundStart,
      hash: generateHash(songs[i + 1].title, REVEAL_PERCENTAGE),
      guesses: [],
      winnerId: null,
    };

    gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) return;
    gameState.countDown = true;
    gameState.isPlaying = false;
    gameState.nextRound = nextRound;
    gameState.round = null;
    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    // 5. Wait 3s interval for countdown before next round
    await delay(ADDED_TIME_TO_ROUND);
  }
}
