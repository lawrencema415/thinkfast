import { Redis } from '@upstash/redis';
import {
  type Room,
  Song,
  Player,
  GameState,
  ROLE,
  User,
  SYSTEM_MESSAGE_TYPE,
  SystemMessage,
  Message,
} from "@/shared/schema";
// Remove: import { User } from '@supabase/supabase-js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

/**
 * Generates a random room code for joining game rooms.
 * Creates a 5-character uppercase alphanumeric code (excluding easily confused characters).
 * @returns A unique room code string
 */
const generateRoomCode = (): string =>  {
  // Use characters that are easy to read and type
  // Exclude easily confused characters like 0/O, 1/I/L, etc.
  const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const codeLength = 6;
  let code = "";

  // Generate random characters for the code
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
}

export class RedisStorage {
  private generateId(): string {
    return crypto.randomUUID();
  }

  async saveGameAndMessages(roomId: string, gameState: GameState, messages: (SystemMessage | Message)[]): Promise<void> {
    await redis
      .pipeline()
      .set(`gameState:${roomId}`, JSON.stringify(gameState))
      .set(`messages:${roomId}`, JSON.stringify(messages))
      .exec();
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean | null> {
    const key = `gameState:${roomId}`;
    const gameState = await redis.get<GameState>(key);
    
    if (!gameState) return null;
    
    const player = gameState.players.some(player => player.user.id === userId);
    return player ? true : false;
  }

  async resolveRoomId(roomIdOrCode: string): Promise<string | null> {
    if (roomIdOrCode.includes('-')) return roomIdOrCode; // UUID
    return await redis.get(`roomCode:${roomIdOrCode}`);
  }

  async saveGameState(roomId: string, gameState: GameState): Promise<void> {
    const key = `gameState:${roomId}`;
    await redis.set(key, JSON.stringify(gameState));
  }

  async saveMessagesState(roomId: string, messages: (SystemMessage | Message)[]): Promise<void> {
    const key = `messages:${roomId}`;
    await redis.set(key, JSON.stringify(messages));
  }

  // Room operations
  // In createRoom, convert user (Supabase) to your schema User type if needed
  async createRoom(user: User, options: { songsPerPlayer: number; timePerSong: number }): Promise<GameState> {
    const id = this.generateId();
    const code = generateRoomCode();
    const createdAt = new Date();

    const room: Room = {
      id,
      code
    };

    const gameState: GameState = {
      id,
      createdAt,
      hostId: user.id,
      isActive: true,
      isPlaying: false,
      players: [
        {
          user,
          role: ROLE.HOST,
          score: 0,
        },
      ],
      room,
      songs: [],
      songsPerPlayer: options.songsPerPlayer,
      timePerSong: options.timePerSong,
      totalRounds: 0,
      round: null,
      nextRound: null,
      countDown: false,
    };

    await redis.pipeline()
      // Set game state
      .set(`gameState:${id}`, JSON.stringify(gameState))
      // For room code look up
      .set(`roomCode:${room.code}`, room.id)
      // Initialize empty messages array for this game state
      .set(`messages:${id}`, JSON.stringify([]))
      .exec();

    return gameState;
  }

  async getRoomByCode(code: string): Promise<string | null> {
    return await redis.get<string>(`roomCode:${code}`)
  }

  async getGameStateByRoomCode(code: string): Promise<GameState | null> {
    // const roomId = await redis.get<string>(`roomCode:${code}`);
    const roomId = await this.getRoomByCode(code);
    if (!roomId) return null;
  
    // Retrieve the game state as a string
    const state = await redis.get<string>(`gameState:${roomId}`);
    
    // If the state is already parsed (i.e., not a JSON string), return it as-is
    if (state && typeof state === 'string') {
      try {
        return JSON.parse(state);
      } catch (error) {
        console.error('Error parsing game state:', error);
        return null;
      }
    }
  
    return state as GameState | null;
  }

  // Player operations
  // In addPlayerToRoom, wrap user in Player for messages
  async addPlayerToRoom(roomCode: string, user: User): Promise<Player> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);
  
    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${roomId}`);
  
    let gameState: GameState;
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }
  
    const player: Player = { user, role: ROLE.PLAYER, score: 0 };
    gameState.players.push(player);
  
    const displayName = user.user_metadata?.display_name || 'A new player';
  
    const message: SystemMessage = {
      id: crypto.randomUUID(),
      roomId,
      content: `${displayName} has joined the room`,
      type: SYSTEM_MESSAGE_TYPE,
      createdAt: new Date(),
    };
  
    const messagesKey = `messages:${roomId}`;
    const messages = await redis.get<(SystemMessage | Message)[]>(messagesKey) || [];
    messages.push(message);
  
    await redis.pipeline()
      .set(key, JSON.stringify(gameState))
      .set(messagesKey, JSON.stringify(messages))
      .exec();
  
    return player;
  }
  
  // In removePlayerFromRoom, wrap user in Player for messages
  async removePlayerFromRoom(roomCode: string, user: User, method: string): Promise<void> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);
    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${roomId}`);

    let gameState: GameState;
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }

    const isUserInRoom = await this.isUserInRoom(roomId, user.id);
    if (!isUserInRoom) {
      console.log(`Player ${user.id} not found in room ${roomCode}`);
      return;
    }

    const isHost = gameState.hostId === user.id;
    gameState.players = gameState.players.filter(p => p.user.id !== user.id);
    gameState.songs = gameState.songs.filter(song => song.userId !== user.id);

    const displayName = user?.user_metadata?.display_name || 'A player';
    const content = method === 'disconnect' ? `${displayName} has disconnected` :
                    method === 'kick' ? `${displayName} has been removed from the room` :
                    `${displayName} has left the room`;

    const message: SystemMessage = {
      id: crypto.randomUUID(),
      roomId,
      content,
      type: SYSTEM_MESSAGE_TYPE,
      createdAt: new Date(),
    };

    const messagesKey = `messages:${roomId}`;
    const messages = await redis.get<(SystemMessage | Message)[]>(messagesKey) || [];
    messages.push(message);

    if (isHost && gameState.players.length > 0) {
      const nextHost = gameState.players[0];
      gameState.hostId = nextHost.user.id;
      const hostIndex = gameState.players.findIndex(p => p.user.id === nextHost.user.id);
      if (hostIndex !== -1) {
        gameState.players[hostIndex].role = ROLE.HOST;
      }

      const newHostMessage: SystemMessage = {
        id: crypto.randomUUID(),
        roomId,
        content: `${nextHost.user.user_metadata?.display_name || 'A player'} is now the host`,
        type: SYSTEM_MESSAGE_TYPE,
        createdAt: new Date(),
      };

      messages.push(newHostMessage);
    }

    await redis.pipeline()
      .set(messagesKey, JSON.stringify(messages))
      .set(key, JSON.stringify(gameState))
      .exec();
  }

  async getPlayersInRoom(roomId: string): Promise<Player[]> {
    if (!roomId) return [];
  
    const json = await redis.get<GameState>(`gameState:${roomId}`);
    if (!json) return [];
  
    return json.players;
  }

  async addSongToRoom(roomCode: string, song: Song): Promise<Song> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);
  
    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${roomId}`);
  
    let gameState: GameState;
    
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }
  
    gameState.songs.push(song);
    await redis.set(key, JSON.stringify(gameState)); // Ensure game state is stringified
    return song;
  }

  async removeSongFromRoom(roomCode: string, songId: string): Promise<void> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);

    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${roomId}`);

    let gameState: GameState;
    
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }

    gameState.songs = gameState.songs.filter(song => song.id !== songId);
    await redis.set(key, JSON.stringify(gameState));
  }

  async shuffleSongsInRoom(roomCode: string): Promise<void> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);

    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${roomId}`);

    let gameState: GameState;

    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }

    const songs = [...gameState.songs];
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]]; // Swap elements
    }
    
    gameState.songs = songs;
    
    await redis.set(key, JSON.stringify(gameState));
  }

  async getMessagesByRoomCode(roomCode: string): Promise<(SystemMessage | Message)[]> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) return [];
    const messagesKey = `messages:${roomId}`;
    const messages = await redis.get<(SystemMessage | Message)[]>(messagesKey);
    return messages || [];
  }
}

export const storage = new RedisStorage();
