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

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState || !gameState.isActive) {
      return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
    }

    const isAlreadyInRoom = gameState.players.some(p => p.user.id === user.id);
    if (isAlreadyInRoom) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }
    
    // Add a system message announcing the new player
    const displayName = user.user_metadata?.display_name || 'A new player';
    const message = {
      id: crypto.randomUUID(),
      roomId: roomId,
      content: `${displayName} has joined the room`,
      type: 'system',
      createdAt: new Date()
    };
    
    gameState.messages.push(message);
    
    // Save the updated game state
    await storage.saveGameState(roomId, gameState);
    await storage.addPlayerToRoom(roomCode, user);
    await broadcastGameState(roomCode, storage);

    return NextResponse.json(gameState.room);
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
