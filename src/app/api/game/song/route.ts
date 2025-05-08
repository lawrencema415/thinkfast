import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  const { user, response } = await verifyAuthInRouteHandler();
  
  if (!user) {
    return response;
  }

  const body = await req.json();
  const { roomCode } = body;

  if (!roomCode) {
    return NextResponse.json(
      { error: 'Room code is required' },
      { status: 400 }
    );
  }

  const roomId = await storage.getRoomByCode(roomCode);
  if (!roomId) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const isUserInRoom = await storage.isUserInRoom(roomId, user.id);
  if (!isUserInRoom) {
    return NextResponse.json({ error: 'User is not in the room' }, { status: 403 });
  }

  const gameState = await storage.getGameStateByRoomCode(roomCode);
  if (!gameState) {
    return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
  }

  if (!gameState.songs || gameState.songs.length === 0) {
    return NextResponse.json({ error: 'No songs in the room' }, { status: 404 });
  }

  const removedSong = gameState.songs.pop();
  gameState.currentTrack = removedSong || null;
  
  await storage.saveGameState(roomId, gameState);
  await broadcastGameState(roomCode, storage);

  return NextResponse.json({ gameState });
}