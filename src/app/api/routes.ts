import { storage } from "./storage";


// Keep track of SSE clients
const clients = new Map<string, Response>();

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

  // Send to all players in room using SSE message format
  for (const player of players) {
    const client = clients.get(player.userId);
    if (client) {
      const sseMessage = {
        type: 'gameState',
        payload: {
          gameState,
          timestamp: new Date().toISOString()
        }
      };
      client.write(`data: ${JSON.stringify(sseMessage)}\n\n`);
    }
  }
};
