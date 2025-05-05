/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { clients, sseEncoder as encoder } from '@/lib/sse-clients';

// Use the global clients map
const messages: string[] = [];

export async function GET(request: NextRequest) {
  const { user } = await verifyAuthInRouteHandler();
  const url = new URL(request.url);
  const message = url.searchParams.get('message');
  const userId = user?.id;
  
  console.log(`GET /api/events - User ID: ${userId}, Client count before: ${clients.size}, Clients: ${Array.from(clients.keys())}`);
  // const userId = url.searchParams.get('userId'); 

  let parsedMessage: any = null;

  if (message) {
    try {
      parsedMessage = JSON.parse(message);
      console.log('Parsed message:', parsedMessage);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  if (message && userId) {
    const serverMessage = `Server received: ${message}`;
    messages.push(serverMessage);

    // Only broadcast to the specific user
    const controller = clients.get(userId);
    if (controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: serverMessage })}\n\n`)
        );
      } catch (e) {
        console.log('Error sending message to client:', e);
        clients.delete(userId);
      }
    }

    return NextResponse.json({
      success: true,
      activeClients: clients.size
    });
  }

  // Otherwise, set up an SSE connection for this user
  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`)
        );

        messages.forEach(msg => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`)
          );
        });

        // Add this client to our map
        clients.set(userId, controller);
        console.log(`Client added - User ID: ${userId}, Total clients: ${clients.size}, All clients: ${Array.from(clients.keys())}`);

        const pingIntervalId = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(':\n\n'));
          } catch (e) {
            console.log(`Ping failed for user ${userId}, removing client`, e);
            clearInterval(pingIntervalId);
            clients.delete(userId);
          }
        }, 15000);

        (controller as any).pingIntervalId = pingIntervalId;
      } catch (error) {
        console.error('Error in stream start:', error);
        clients.delete(userId);
      }
    },
    cancel(controller) {
      console.log(`Stream cancelled for user ${userId}, removing client`);
      if ((controller as any).pingIntervalId) {
        clearInterval((controller as any).pingIntervalId);
      }
      clients.delete(userId);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}


// Broadcast game state to all connected clients in the room
export const broadcastGameState = async (roomId: string, storage: any) => {
  const room = await storage.getRoom(roomId);
  if (!room) {
    console.error('No room to broadcast', roomId);
    return;
  }

  const players = await storage.getPlayersInRoom(roomId);
  const songs = await storage.getSongsForRoom(roomId);
  const messages = await storage.getMessagesForRoom(roomId);

  const gameState = {
    room,
    players,
    songs,
    messages,
    currentTrack: room.isPlaying ? songs.find((s: any) => !s.isPlayed) : null,
    currentRound: songs.filter((s: any) => s.isPlayed).length,
    totalRounds: songs.length,
    isPlaying: room.isPlaying,
    timeRemaining: room.timePerSong
  };

  console.log('broadcasting game state', gameState);


  // TODO: Fix any typings of this page after schema is more defined
  // Log the actual connected clients from the clients Map
  console.log(`Connected clients (${clients.size}):`, Array.from(clients.keys()));
  console.log('Players to broadcast to:', players.map((p: any) => p.userId));

  for (const player of players) {
    // Check if this player has an active connection
    if (clients.has(player.userId)) {
      console.log(`Broadcasting to player ${player.userId} (connection found)`);
      const controller = clients.get(player.userId);
      if (controller) {
        const sseMessage = {
          type: 'gameState',
          payload: {
            gameState,
            timestamp: new Date().toISOString()
          }
        };
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(sseMessage)}\n\n`)
          );
        } catch (e) {
          console.log('Error sending game state to client:', e);
          clients.delete(player.userId);
        }
      }
    } else {
      console.log(`Player ${player.userId} has no active connection`);
    }
  }
};
