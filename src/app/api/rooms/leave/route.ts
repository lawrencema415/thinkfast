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

    // Find room and player
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        players: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const player = room.players.find(
      (p) => p.userId === session.user.id
    );

    if (!player) {
      return NextResponse.json({ error: 'Not in room' }, { status: 400 });
    }

    // If player is host, deactivate room
    if (player.isHost) {
      await db.room.update({
        where: { id: roomId },
        data: { isActive: false },
      });
    }

    // Remove player from room
    await db.roomPlayer.delete({
      where: { id: player.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
} 