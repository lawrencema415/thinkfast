import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    if (!user) return response;

    const body = await req.json();
    const { roomCode } = body;

    console.log('Leaving room:', roomCode);

    // Resolve room ID from room code
    const roomId = await storage.resolveRoomId(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomId);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    const wasInRoom = gameState.players.some(p => p.user.id === user.id);
    if (!wasInRoom) {
      return NextResponse.json({ error: 'User not in room' }, { status: 400 });
    }

    await storage.removePlayerFromRoom(roomId, user.id);
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
