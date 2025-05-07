import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function PUT(req: Request) {
  try {
    // Verify authentication
    const { user, response } = await verifyAuthInRouteHandler();
    
    // If not authenticated, return the error response
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode, songsPerPlayer, timePerSong } = body

    // Get the room ID from the code
    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get the current game state
    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    // Verify the user is the host
    if (gameState.hostId !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can update room settings' },
        { status: 403 }
      );
    }

    // Update the game state with new settings
    if (songsPerPlayer !== undefined) {
      gameState.songsPerPlayer = songsPerPlayer;
    }

    if (timePerSong !== undefined) {
      gameState.timePerSong = timePerSong;
    }

    // Add a system message about the settings change
    const message = {
      id: crypto.randomUUID(),
      roomId: roomId,
      content: `Room settings updated: ${songsPerPlayer !== undefined ? `${songsPerPlayer} songs per player` : ''}${
        songsPerPlayer !== undefined && timePerSong !== undefined ? ' and ' : ''
      }${timePerSong !== undefined ? `${timePerSong} seconds per song` : ''}`,
      type: 'system',
      createdAt: new Date()
    };
    
    gameState.messages.push(message);

    // Save the updated game state
    await storage.saveGameState(roomId, gameState);

    // Broadcast the updated game state to all clients
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