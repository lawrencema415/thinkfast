import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../storage';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('roomCode');

  if (!roomCode) {
    return NextResponse.json({ error: 'Room Code is required' }, { status: 400 });
  }

  const messages = await storage.getMessagesByRoomCode(roomCode);

  if (!messages) {
    return NextResponse.json({ error: 'Messages not found' }, { status: 404 });
  }

  return NextResponse.json({ messages });
}
