import { NextRequest, NextResponse } from 'next/server'
import { storage } from '../storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomCode, song } = body;

    if (!roomCode || !song) {
      return NextResponse.json({ error: 'Missing roomCode or song' }, { status: 400 });
    }

    const saved = await storage.addSongToRoom(roomCode, song);

    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to add song:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
