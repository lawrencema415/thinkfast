import { Redis } from '@upstash/redis';
import {
  type Room,
  Song,
  Message,
  Player,
  GameState,
  ROLE,
} from "@/shared/schema";
import { User } from '@supabase/supabase-js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

/**
 * Generates a random room code for joining game rooms.
 * Creates a 4-character uppercase alphanumeric code (excluding easily confused characters).
 * @returns A unique room code string
 */
const generateRoomCode = (): string =>  {
  // Use characters that are easy to read and type
  // Exclude easily confused characters like 0/O, 1/I/L, etc.
  const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const codeLength = 4;
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

  async resolveRoomId(roomIdOrCode: string): Promise<string | null> {
    if (roomIdOrCode.includes('-')) return roomIdOrCode; // UUID
    return await redis.get(`roomCode:${roomIdOrCode}`);
  }

  async saveGameState(roomId: string, gameState: GameState): Promise<void> {
    const key = `gameState:${roomId}`;
    await redis.set(key, JSON.stringify(gameState)); // Ensure the game state is stringified
  }

  // Room operations
  async createRoom(user: User, options: { songsPerPlayer: number; timePerSong: number }): Promise<GameState> {
    const id = this.generateId();
    const code = generateRoomCode();
    const createdAt = new Date();

    const room: Room = {
      id,
      code
    };

    const gameState: GameState = {
      id, // Add the id property
      createdAt,
      currentRound: 0,
      currentTrack: null,
      hostId: user.id,
      isActive: true,
      isPlaying: false,
      messages: [],
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
      timeRemaining: options.timePerSong,
      totalRounds: 0,
    };

    // Set game state
    await redis.set(`gameState:${id}`, JSON.stringify(gameState)); // Ensure the game state is stringified
    // For room code look up
    await redis.set(`roomCode:${room.code}`, room.id);
    return gameState;
  }

  // not used
  // async getRoom(roomId: string): Promise<Room | null> {
  //   const key = `room:${roomId}`;
  //   return await redis.get<Room>(key);
  // }
  

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

  async updateRoom(code: string, updates: Partial<Room>): Promise<Room> {
    const roomId = await this.getRoomByCode(code);
    if (!roomId) throw new Error(`Room with code '${code}' not found.`);

    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);

    let gameState: GameState;
    
    // Try to parse json string, or assume it's already an object
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }

    // TODO: not working
    const updatedRoom = { ...gameState.room, ...updates };
    await redis.set(key, JSON.stringify(gameState));
    return updatedRoom;
  }

  // Player operations
  async addPlayerToRoom(roomCode: string, user: User): Promise<Player> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);
    
    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    
    // Check if json is a valid string
    if (!json) throw new Error(`Game state not found for room ${roomId}`);
  
    let gameState: GameState;
    
    // Try to parse json string, or assume it's already an object
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }
  
    const player: Player = { user, role: ROLE.PLAYER, score: 0 };
    gameState.players.push(player);
    
    // Save the updated game state back to Redis
    await redis.set(key, JSON.stringify(gameState));
    return player;
  }
  
  async removePlayerFromRoom(roomCode: string, userId: string): Promise<void> {
    const roomId = await this.getRoomByCode(roomCode);
    if (!roomId) throw new Error(`Room with code '${roomCode}' not found.`);
    
    const key = `gameState:${roomId}`;
    const json = await redis.get<string>(key);
    
    // Check if json is valid
    if (!json) throw new Error(`Game state not found for room ${roomId}`);
    
    let gameState: GameState;
    
    // Try to parse json string, or assume it's already an object
    try {
      gameState = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      console.error('Error parsing game state:', error);
      throw new Error('Failed to parse game state');
    }
  
    // Remove the player from the game state
    gameState.players = gameState.players.filter(p => p.user.id !== userId);
    
    // Save the updated game state back to Redis
    await redis.set(key, JSON.stringify(gameState));
  }

  async getPlayersInRoom(roomId: string): Promise<Player[]> {
    // const resolvedRoomId = await this.resolveRoomId(roomId);
    // if (!resolvedRoomId) return [];

    if (!roomId) return [];
  
    const json = await redis.get<GameState>(`gameState:${roomId}`);
    if (!json) return [];
  
    return json.players;
  }

  async getSongsForRoom(roomId: string): Promise<Song[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const json = await redis.get<GameState>(`gameState:${resolvedRoomId}`);
    if (!json) return [];

    console.log('json', json); // Log the raw JSON string to the consol
  
    return json.songs;
  }

  // async saveMessage(message: Message): Promise<Message>{
  //   // First, add the message to the game state
  //   const roomId = message.roomId;
  //   const key = `gameState:${roomId}`;
  //   const json = await redis.get<string>(key);
    
  //   if (!json) throw new Error(`Game state not found for room ${roomId}`);
    
  //   let gameState: GameState;
    
  //   try {
  //     gameState = typeof json === 'string' ? JSON.parse(json) : json;
  //   } catch (error) {
  //     console.error('Error parsing game state:', error);
  //     throw new Error('Failed to parse game state');
  //   }
    
  //   // Add the message to the game state's messages array
  //   gameState.messages.push(message);
    
  //   // Save the updated game state back to Redis
  //   await redis.set(key, JSON.stringify(gameState));
    
  //   return message;
  // }


  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const json = await redis.get<string>(`gameState:${resolvedRoomId}`);
    if (!json) return [];
  
    return (JSON.parse(json) as GameState).messages;
  }

  async addSongToRoom(roomId: string, song: Song): Promise<Song> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) throw new Error(`Room with ID or code '${roomId}' not found.`);
  
    const key = `gameState:${resolvedRoomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${resolvedRoomId}`);
  
    const gameState = JSON.parse(json) as GameState;
  
  
    gameState.songs.push(song);
    await redis.set(key, JSON.stringify(gameState)); // Ensure game state is stringified
    return song;
  }

  async addMessageToRoom(roomId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) throw new Error(`Room with ID or code '${roomId}' not found.`);
  
    const key = `gameState:${resolvedRoomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${resolvedRoomId}`);
  
    const gameState = JSON.parse(json) as GameState;
  
    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      createdAt: new Date(),
    };
  
    gameState.messages.push(newMessage);
    await redis.set(key, JSON.stringify(gameState)); // Ensure game state is stringified
    return newMessage;
  }

  

  // async getMessagesForRoom(roomId: string): Promise<Message[]> {
  //   const room = await this.getRoom(roomId);
  //   if (!room) return [];

  //   const messageIds = await redis.zrange(room:${roomId}:messages, 0, -1);
  //   const messages = await Promise.all(
  //     messageIds.map(id => redis.hgetall(message:${id}))
  //   );
  //   return messages.filter(Boolean) as Message[];
  //   const resolvedRoomId = await this.resolveRoomId(roomId);
  //   if (!resolvedRoomId) return [];

  //   const json = await redis.get<string>(gameState:${resolvedRoomId});
  //   if (!json) return [];

  //   return (JSON.parse(json) as GameState).messages;
  // }

}

export const storage = new RedisStorage();
