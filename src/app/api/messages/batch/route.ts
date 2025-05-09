import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { broadcastGameState } from '@/lib/broadcast';
import { Player } from '@/shared/schema';

import { storage } from '../../storage';

type IncomingMessage = { id: string; content: string };

export async function POST(req: Request) {
  try {
    const { user, response } = await verifyAuthInRouteHandler();
    if (!user) return response;

    const body = await req.json();
    const { roomCode, messages, type = 'chat' } = body;

    if (
      !roomCode ||
      !Array.isArray(messages) ||
      messages.length === 0 ||
      !messages.every((m: IncomingMessage) => typeof m.content === 'string' && typeof m.id === 'string')
    ) {
      return NextResponse.json(
        { error: 'Room code and messages (with id and content) are required' },
        { status: 400 }
      );
    }

    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const isUserInRoom = await storage.isUserInRoom(roomId, user.id);
    if (!isUserInRoom) {
      return NextResponse.json({ error: 'User is not in the room' }, { status: 403 });
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    // Find the Player object for the user in the room
    const player = gameState.players.find((p: Player) => p.user.id === user.id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found in room' }, { status: 404 });
    }

    const messageStorage = await storage.getMessagesByRoomCode(roomCode);

    const newMessages = messages.map((msg: IncomingMessage) => ({
      id: msg.id,
      displayName: player.user.user_metadata?.display_name,
      avatarUrl: player.user.user_metadata?.avatarUrl,
      roomId,
      user: player,
      content: msg.content,
      type,
      createdAt: new Date(),
    }));

    messageStorage.push(...newMessages);

    await storage.saveMessagesState(roomId, messageStorage);
    await broadcastGameState(roomCode, storage);

    return NextResponse.json({ success: true, messages: newMessages });
  } catch (error) {
    console.error('Error sending messages:', error);
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    );
  }
}
