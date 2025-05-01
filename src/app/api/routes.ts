import { storage } from "./storage";
import { NextResponse } from 'next/server';

// SSE endpoint to handle client connections
const clients = new Map<string, (data: string) => void>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      clients.set(userId, send);

      // Remove client on disconnect
      req.signal.addEventListener('abort', () => {
        clients.delete(userId);
        controller.close();
      });
    },
  });

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  return new Response(stream, { headers });
}

// Helper function to broadcast game state
export const broadcastGameState = async (roomId: string) => {
  const room = await storage.getRoom(roomId);
  if (!room) return;

  const players = await storage.getPlayersInRoom(roomId);
  const songs = await storage.getSongsForRoom(roomId);
  const messages = await storage.getMessagesForRoom(roomId);

  const gameState = {
    room,
    players,
    songs,
    messages,
    currentTrack: room.isPlaying ? songs.find(s => !s.isPlayed) : null,
    currentRound: songs.filter(s => s.isPlayed).length,
    totalRounds: songs.length,
    isPlaying: room.isPlaying,
    timeRemaining: room.timePerSong
  };

  for (const player of players) {
    const send = clients.get(player.userId);
    console.log('from server send', send);
    if (send) {
      const sseMessage = {
        type: 'gameState',
        payload: {
          gameState,
          timestamp: new Date().toISOString()
        }
      };
      send(JSON.stringify(sseMessage));
    }
  }
};
