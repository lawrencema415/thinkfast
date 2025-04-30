import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roomCode } = body;

    // Find room by code
    const room = await db.room.findFirst({
      where: { code: roomCode },
      include: {
        players: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json({ error: 'Room is not active' }, { status: 400 });
    }

    // Check if user is already in the room
    const existingPlayer = room.players.find(
      (player) => player.userId === session.user.id
    );

    if (existingPlayer) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }

    // Add player to room
    await db.roomPlayer.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        isHost: false,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
} 