import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';

// TODO: TEMPLATE FROM CREATE, UPDATE TO START ROUTE!
export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();

  if (!user) return response;

  const body = await req.json();
  const { songsPerPlayer, timePerSong } = body;

  const room = await storage.createRoom(user, {
    songsPerPlayer,
    timePerSong,
  });

  await storage.addPlayerToRoom({
    roomId: room.id,
    userId: user.id,
    isHost: true,
  });

  await broadcastGameState(room.id, storage);

  return NextResponse.json(room);
}
