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
    const { roomId } = body;

    // Find room and verify host
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        players: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const host = room.players.find(
      (p) => p.userId === session.user.id && p.isHost
    );

    if (!host) {
      return NextResponse.json({ error: 'Not host' }, { status: 403 });
    }

    if (room.players.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 players' },
        { status: 400 }
      );
    }

    // Start game
    await db.room.update({
      where: { id: roomId },
      data: { isPlaying: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
} 