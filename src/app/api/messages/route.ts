import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../storage';
import { broadcastGameState } from '@/lib/broadcast';

// NOTE: Possibly improve chat functionality later with: https://upstash.com/blog/realtime-notifications
export async function POST(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    
    if (!user) {
      return response;
    }

    const body = await req.json();
    const { roomCode, content, messageType = 'chat' } = body;

    if (!roomCode || !content) {
      return NextResponse.json(
        { error: 'Room code and message content are required' },
        { status: 400 }
      );
    }

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isUserInRoom = await storage.isUserInRoom(roomId, user.id);
    if (!isUserInRoom){

      return NextResponse.json({ error: 'User is not in the room' }, { status: 403 });
    }

    const messages = await storage.getMessagesByRoomCode(roomCode);
    if (!messages) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    const message = {
      id: crypto.randomUUID(),
      displayName: user.user_metadata?.display_name,
      avatarUrl: user.user_metadata?.avatarUrl,
      roomId: roomId,
      user: user, 
      content,
      type: messageType,
      createdAt: new Date()
    };

    messages.push(message);
    
    await storage.saveMessagesState(roomId, messages);
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
