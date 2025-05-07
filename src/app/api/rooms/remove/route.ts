import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    if (!user) return response;

    const body = await req.json();
    const { roomCode, playerId } = body;

    if (!roomCode || !playerId) {
      return NextResponse.json({ error: 'Room code and player ID are required' }, { status: 400 });
    }

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    // Verify the requesting user is the host
    if (gameState.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can remove players' }, { status: 403 });
    }

    // Verify the player to be removed exists in the room
    const playerToRemove = gameState.players.find(p => p.user.id === playerId);
    if (!playerToRemove) {
      return NextResponse.json({ error: 'Player not found in room' }, { status: 404 });
    }

    // Prevent host from removing themselves through this endpoint
    if (playerId === user.id) {
      return NextResponse.json({ error: 'Host cannot remove themselves. Use the leave endpoint instead.' }, { status: 400 });
    }

    // Remove the player
    await storage.removePlayerFromRoom(roomCode, playerToRemove.user, 'kick');
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player:', error);
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
  }
}