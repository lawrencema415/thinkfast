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

    console.log('leaving this room code', roomCode)

    // Find room by code using Redis storage
    const room = await storage.getRoomByCode(roomCode);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get players in room
    const players = await storage.getPlayersInRoom(room.id);

    // Check if user is in the room
    const existingPlayer = players.find(
      (player) => player.userId === user.id
    );

    if (!existingPlayer) {
      return NextResponse.json({ error: 'Not in room' }, { status: 400 });
    }

    // If player is host, deactivate room
    // const isHost = user.id === room.hostId;
    // if (isHost) {
    //   await storage.updateRoom(room.id, { isActive: false });
    // }

    // Remove player from room using Redis storage
    await storage.removePlayerFromRoom(room.id, user.id);

    // Broadcast updated game state to all players
    await broadcastGameState(room.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}