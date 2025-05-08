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
    const { roomCode, song } = body;

    if (!roomCode ) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 400 }
      );
    }

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!storage.isUserInRoom(roomId, user.id)){
      return NextResponse.json({ error: 'User is not in the room' }, { status: 403 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    const songExists = gameState.songs.some(existingSong => existingSong.sourceId === song.sourceId);
    if (songExists) {
      return NextResponse.json({ error: 'Song already added' }, { status: 409 });
    }
    
    await storage.addSongToRoom(roomCode, song)
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
  }
}