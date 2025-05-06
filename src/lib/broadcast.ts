/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/broadcast.ts
import { clients, sseEncoder as encoder } from './sse-clients';
import type { GameState } from '@/shared/schema';

// TODO: Fix any typings of this page after schema is more defined
export const broadcastGameState = async (roomCode: string, storage: any) => {
  const gameState = await storage.getGameStateByRoomCode(roomCode) as GameState;
  if (!gameState) {
    console.error('No room to broadcast', roomCode);
    return;
  }

  const players = await storage.getPlayersInRoom(gameState.room.id);
  // TODO: Fix any typings of this page after schema is more defined
  // Log the actual connected clients from the clients Map
  // console.log(`Connected clients (${clients.size}):`, Array.from(clients.keys()));
  // console.log('Players to broadcast to:', players.map((p: any) => p.userId));

  for (const player of players) {
    // Check if this player has an active connection
    if (clients.has(player.user.id)) {
      const controller = clients.get(player.user.id);
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
          clients.delete(player.user.id);
        }
      }
    } else {
      console.log(`Player ${player.user.id} has no active connection`);
    }
  }
};

export const broadcastMessage = async (roomCode: string, message: any, storage: any) => {
  const room = await storage.getRoomByCode(roomCode);
  if (!room) {
    console.error('No room to broadcast message to', roomCode);
    return;
  }

  const players = await storage.getPlayersInRoom(room.id);

  for (const player of players) {
    // Check if this player has an active connection
    if (clients.has(player.userId)) {
      console.log(`Updating chatbox for player ${player.userId} (connection found)`);
      const controller = clients.get(player.userId);
      if (controller) {
        const sseMessage = {
          type: message.type || 'chat',
          payload: {
            roomCode,
            userId: message.userId,
            content: message.content,
            createdAt: new Date().toISOString()
          }
        };
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(sseMessage)}\n\n`)
          );
        } catch (e) {
          console.log('Error sending message to client:', e);
          clients.delete(player.userId);
        }
      }
    } else {
      console.log(`Player ${player.userId} has no active connection`);
    }
  }
};
