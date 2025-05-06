import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();

  if (!user) return response;

  const body = await req.json();
  const { songsPerPlayer, timePerSong } = body;

  const gameState = await storage.createRoom(user, {
    songsPerPlayer,
    timePerSong,
  });

  await broadcastGameState(gameState.room.code, storage);

  return NextResponse.json(gameState);
}
