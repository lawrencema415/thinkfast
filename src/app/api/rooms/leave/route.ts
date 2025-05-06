import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  try {
    // Verify authentication using our server-side auth helper
    const { user, response } = await verifyAuthInRouteHandler();
    
    // If not authenticated, return the error response
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode } = body;

    console.log('leaving this room code', roomCode)

    // Find room by code using Redis storage
    const room = await storage.getRoomByCode(roomCode);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Remove player from room using Redis storage
    await storage.removePlayerFromRoom(room.id, user.id);

    // Broadcast updated game state to all players
    await broadcastGameState(room.id, storage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
