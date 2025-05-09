import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';
import { SYSTEM_MESSAGE_TYPE } from '@/shared/schema';

export async function PUT(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode, songsPerPlayer, timePerSong } = body

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    if (gameState.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can update room settings' },
        { status: 403 }
      );
    }

    if (songsPerPlayer !== undefined) {
      gameState.songsPerPlayer = songsPerPlayer;
    }

    if (timePerSong !== undefined) {
      gameState.timePerSong = timePerSong;
    }

    const message = {
      id: crypto.randomUUID(),
      roomId: roomId,
      content: `Room settings updated: ${songsPerPlayer !== undefined ? `${songsPerPlayer} songs per player` : ''}${
        songsPerPlayer !== undefined && timePerSong !== undefined ? ' and ' : ''
      }${timePerSong !== undefined ? `${timePerSong} seconds per song` : ''}`,
      type: SYSTEM_MESSAGE_TYPE,
      createdAt: new Date()
    };
    
    gameState.messages.push(message);

    await storage.saveGameState(roomId, gameState);
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({
      success: true,
      message: 'Room settings updated successfully',
      settings: {
        songsPerPlayer: gameState.songsPerPlayer,
        timePerSong: gameState.timePerSong
      }
    });
  } catch (error) {
    console.error('Error updating room settings:', error);
    return NextResponse.json(
      { error: 'Failed to update room settings' },
      { status: 500 }
    );
  }
}