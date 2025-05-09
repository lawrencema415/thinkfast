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

  // Set game settings
  if (typeof songsPerPlayer === 'number') gameState.songsPerPlayer = songsPerPlayer;
  if (typeof timePerSong === 'number') gameState.timePerSong = timePerSong;

  gameState.countDown = true;
  await storage.saveGameState(roomId, gameState);
  await broadcastGameState(roomCode, storage);
  
  // Wait 3 seconds, then set countDown to false and isPlaying to true
  setTimeout(async () => {
    const updatedGameState = await storage.getGameStateByRoomCode(roomCode);
    if (updatedGameState) {
      updatedGameState.countDown = false;
      updatedGameState.isPlaying = true;
      await storage.saveGameState(roomId, updatedGameState);
      await broadcastGameState(roomCode, storage);
    }
  }, 3000);

  await storage.saveGameState(roomId, gameState);
  await storage.shuffleSongsInRoom(roomCode);
  await broadcastGameState(roomCode, storage);

  return NextResponse.json(gameState.room);
}
