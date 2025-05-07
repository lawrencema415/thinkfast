/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/broadcast.ts
import { clients, sseEncoder as encoder } from './sse-clients';
import type { GameState } from '@/shared/schema';

// Broadcast updated game state to all connected players in a room
export const broadcastGameState = async (roomCode: string, storage: any) => {
  const gameState = await storage.getGameStateByRoomCode(roomCode) as GameState;

  if (!gameState) {
    console.error('[broadcastGameState] No room found for code:', roomCode);
    return;
  }

  const players = await storage.getPlayersInRoom(gameState.room.id);
  const timestamp = new Date();

  const sseMessage = {
    type: 'gameState',
    payload: { gameState, timestamp }
  };

  // Encode message once
  const encodedMessage = encoder.encode(`data: ${JSON.stringify(sseMessage)}\n\n`);

  for (const player of players) {
    const userId = player.user?.id;
    if (!userId) {
      console.warn('[broadcastGameState] Skipping player with invalid user ID:', player);
      continue;
    }

    const controller = clients.get(userId);
    if (!controller) {
      console.log(`[broadcastGameState] Player ${userId} has no active SSE connection`);
      continue;
    }

    try {
      controller.enqueue(encodedMessage);
    } catch (error) {
      console.error(`[broadcastGameState] Failed to send to ${userId}:`, error);
      clients.delete(userId); // Clean up dead connection
    }
  }
};
