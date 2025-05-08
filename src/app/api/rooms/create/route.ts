import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';

const MIN_SONGS_PER_PLAYER = 1;
const MAX_SONGS_PER_PLAYER = 5;
const MIN_TIME_PER_SONG = 5;
const MAX_TIME_PER_SONG = 15;

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();

  if (!user) return response;

  const body = await req.json();
  const { songsPerPlayer, timePerSong } = body;

  // Validations
  if (!songsPerPlayer || typeof songsPerPlayer !== 'number' || songsPerPlayer < MIN_SONGS_PER_PLAYER || songsPerPlayer > MAX_SONGS_PER_PLAYER) {
    return NextResponse.json(
      { error: `Songs per player must be between ${MIN_SONGS_PER_PLAYER} and ${MAX_SONGS_PER_PLAYER}` },
      { status: 400 }
    );
  }

  if (!timePerSong || typeof timePerSong !== 'number' || timePerSong < MIN_TIME_PER_SONG || timePerSong > MAX_TIME_PER_SONG) {
    return NextResponse.json(
      { error: `Time per song must be between ${MIN_TIME_PER_SONG} and ${MAX_TIME_PER_SONG} seconds` },
      { status: 400 }
    );
  }

  const gameState = await storage.createRoom(user, {
    songsPerPlayer,
    timePerSong,
  });

  await broadcastGameState(gameState.room.code, storage);

  return NextResponse.json(gameState);
}
