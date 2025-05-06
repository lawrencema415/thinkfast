import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';
import { Player } from '@/shared/schema';

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();
  if (!user) return response;

  const body = await req.json();
  const { roomCode, songsPerPlayer, timePerSong } = body;

  const roomId = await storage.resolveRoomId(roomCode);
  if (!roomId) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const gameState = await storage.getGameStateByRoomCode(roomId);
  if (!gameState) {
    return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
  }

  const player = gameState.players.find((p: Player) => p.user.id === user.id);
  if (player?.user.id !== gameState.hostId) {
    return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
  }

  if (gameState.isActive) {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  }

  // Activate room and set game settings
  gameState.isActive = true;
  gameState.songsPerPlayer = songsPerPlayer;
  gameState.timePerSong = timePerSong;

  await storage.saveGameState(roomId, gameState);
  await broadcastGameState(roomCode, storage);

  return NextResponse.json(gameState.room);
}
