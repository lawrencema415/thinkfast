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

  // Activate room and set game settings
  gameState.isPlaying = true;
  gameState.songsPerPlayer = songsPerPlayer;
  gameState.timePerSong = timePerSong;

  // TODO: Clean up saveGameState to use roomCode and convert to roomId
  // make it more consistent with the rest of the codebase
  await storage.saveGameState(roomId, gameState);
  
  await broadcastGameState(roomCode, storage);

  return NextResponse.json(gameState.room);
}
