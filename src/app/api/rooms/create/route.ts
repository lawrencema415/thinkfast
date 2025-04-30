import { NextResponse } from 'next/server';
import { storage } from '../../storage';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { songsPerPlayer, timePerSong, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const roomCode = nanoid(6);
    const room = await storage.createRoom({
      code: roomCode,
      hostId: userId,
      songsPerPlayer,
      timePerSong,
    });

    // Add host as first player
    await storage.addPlayerToRoom({
      roomId: room.id,
      userId: userId,
      isHost: true,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
} 