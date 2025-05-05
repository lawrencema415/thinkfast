import { storage } from "./storage";
import { NextResponse } from 'next/server';
import { clients } from './events/route';

// SSE endpoint to handle client connections
// const clients = new Map<string, (data: string) => void>();

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const userId = searchParams.get('userId');
//   console.log('before broadcast', userId)

//   if (!userId) {
//     return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
//   }

//   const encoder = new TextEncoder();

//   const stream = new ReadableStream({
//     start(controller) {
//       console.log('new sse connection', userId)
//       const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
//       clients.set(userId, send);
//       console.log('connected client', Array.from(clients.keys()));

//       // Remove client on disconnect
//       req.signal.addEventListener('abort', () => {
//         clients.delete(userId);
//         controller.close();
//       });
//     },
//   });

//   const headers = new Headers({
//     'Content-Type': 'text/event-stream',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive',
//   });

//   return new Response(stream, { headers });
// }

// Helper function to broadcast game state
// export const broadcastGameState = async (roomId: string) => {
//   const room = await storage.getRoom(roomId);
//   // const room = await storage.getRoomByCode(roomCode);
//   // if (!room) return;
//   if (!room) {
//     console.error('No room to broadcast', roomId);
//     return;
//   }

//   const players = await storage.getPlayersInRoom(roomId);
//   const songs = await storage.getSongsForRoom(roomId);
//   const messages = await storage.getMessagesForRoom(roomId);

  
//   const gameState = {
//     room,
//     players,
//     songs,
//     messages,
//     currentTrack: room.isPlaying ? songs.find(s => !s.isPlayed) : null,
//     currentRound: songs.filter(s => s.isPlayed).length,
//     totalRounds: songs.length,
//     isPlaying: room.isPlaying,
//     timeRemaining: room.timePerSong
//   };

//   console.log('broadcasting game state', gameState);
  
//   for (const player of players) {
//     console.log('Broadcasting to player:', {
//       playerId: player.userId,
//       connectedClients: Array.from(clients.keys()),
//       hasConnection: clients.has(player.userId)
//     });
//     const send = clients.get(player.userId);
//     console.log('from server send', send);
//     if (send) {
//       const sseMessage = {
//         type: 'gameState',
//         payload: {
//           gameState,
//           timestamp: new Date().toISOString()
//         }
//       };
//       send(JSON.stringify(sseMessage));
//     }
//   }
// };
