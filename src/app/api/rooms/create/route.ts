import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '../../routes';

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();
  console.log('user', user);
  console.log('response', response);
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

  await broadcastGameState(room.id);

  return NextResponse.json(room);
}
