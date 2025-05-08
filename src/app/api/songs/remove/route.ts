import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode, songId } = body;

    if (!roomCode ) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 400 }
      );
    }

    // Find room by code using Redis storage
    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get the current game state
    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }
    
    await storage.removeSongFromRoom(roomCode, songId)
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to remove song' },
      { status: 500 }
    );
  }
}