import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '../../routes';

export async function POST(req: Request) {
  try {
    // Verify authentication using our server-side auth helper
    const { user, response } = await verifyAuthInRouteHandler(req);
    
    // If not authenticated, return the error response
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode } = body;

    // Find room by code using Redis storage
    const room = await storage.getRoomByCode(roomCode);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
    }

    // Get players in room
    const players = await storage.getPlayersInRoom(room.id);

    // Check if user is already in the room
    const existingPlayer = players.find(
      (player) => player.userId === user.id
    );

    if (existingPlayer) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }

    // Add player to room using Redis storage
    await storage.addPlayerToRoom({
      roomId: room.id,
      userId: user.id,
      isHost: false
    });

    // Broadcast updated game state to all players
    await broadcastGameState(room.id);

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}