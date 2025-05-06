import { NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { storage } from '../storage';
import { broadcastGameState } from '@/lib/broadcast';

export async function POST(req: Request) {
  try {
    // Verify authentication using our server-side auth helper
    const { user, response } = await verifyAuthInRouteHandler();
    
    // If not authenticated, return the error response
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

    // Find room by code using Redis storage
    const roomId = await storage.getRoomByCode(roomCode);
    if (!roomId) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Create a message object
    const message = {
      id: crypto.randomUUID(),
      roomId: roomId,
      userId: user.id,
      content,
      type: messageType,
      createdAt: new Date().toISOString()
    };

    // Store the message in Redis (optional, depending on if you want message history)
    await storage.saveMessage(message);

    // Broadcast the message to all players in the room
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

// // GET request handler to retrieve messages for a room
// export async function GET(request: NextRequest) {
//   try {
//     // Verify authentication using our server-side auth helper
//     const { user, response } = await verifyAuthInRouteHandler();
    
//     // If not authenticated, return the error response
//     if (!user) {
//       return response;
//     }

//     const url = new URL(request.url);
//     const roomCode = url.searchParams.get('roomCode');

//     if (!roomCode) {
//       return NextResponse.json(
//         { error: 'Room code is required' },
//         { status: 400 }
//       );
//     }

//     // Find room by code using Redis storage
//     const room = await storage.getRoomByCode(roomCode);
//     if (!room) {
//       return NextResponse.json({ error: 'Room not found' }, { status: 404 });
//     }

//     // Get messages for the room
//     const messages = await storage.getMessagesByRoomId(room.id);

//     return NextResponse.json({ success: true, messages });
//   } catch (error) {
//     console.error('Error retrieving messages:', error);
//     return NextResponse.json(
//       { error: 'Failed to retrieve messages' },
//       { status: 500 }
//     );
//   }
// }