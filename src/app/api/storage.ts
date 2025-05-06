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
    const createdAt = new Date().toISOString();

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

  async getRoom(id: string): Promise<Room | undefined> {
    const room = await redis.hgetall(`room:${id}`);
    return room ? room as Room : undefined;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const roomId = await redis.get(`roomCode:${code}`);
    if (!roomId) return undefined;
    const room = await this.getRoom(roomId as string);
    return room;
  }

  async getGameStateByRoomCode(code: string): Promise<GameState | null> {
    const roomId = await redis.get<string>(`roomCode:${code}`);
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

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const room = await this.getRoom(id);
    if (!room) throw new Error(`Room with id ${id} not found`);

    const updatedRoom = { ...room, ...updates };
    await redis.hset(`room:${id}`, updatedRoom); // Ensure the room is updated correctly
    return updatedRoom;
  }

  // Player operations
  async addPlayerToRoom(roomId: string, user: User): Promise<Player> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) throw new Error(`Room with ID or code '${roomId}' not found.`);
    
    const key = `gameState:${resolvedRoomId}`;
    const json = await redis.get<string>(key);
    
    // Check if json is a valid string
    if (!json) throw new Error(`Game state not found for room ${resolvedRoomId}`);
  
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

  async getPlayersInRoom(roomId: string): Promise<Player[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const json = await redis.get<string>(`gameState:${resolvedRoomId}`);
    if (!json) return [];
  
    return (JSON.parse(json) as GameState).players;
  }

  async getSongsForRoom(roomId: string): Promise<Song[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const json = await redis.get<string>(`gameState:${resolvedRoomId}`);
    if (!json) return [];
  
    return (JSON.parse(json) as GameState).songs;
  }

  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const json = await redis.get<string>(`gameState:${resolvedRoomId}`);
    if (!json) return [];
  
    return (JSON.parse(json) as GameState).messages;
  }

  async addSongToRoom(roomId: string, song: Omit<Song, 'id' | 'isPlayed'>): Promise<Song> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) throw new Error(`Room with ID or code '${roomId}' not found.`);
  
    const key = `gameState:${resolvedRoomId}`;
    const json = await redis.get<string>(key);
    if (!json) throw new Error(`Game state not found for room ${resolvedRoomId}`);
  
    const gameState = JSON.parse(json) as GameState;
  
    const newSong: Song = {
      ...song,
      id: this.generateId(),
      isPlayed: false,
    };
  
    gameState.songs.push(newSong);
    await redis.set(key, JSON.stringify(gameState)); // Ensure game state is stringified
    return newSong;
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

  // TODO: Need to update client
  async removePlayerFromRoom(roomId: string, userId: string): Promise<void> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) throw new Error(`Room with ID or code '${roomId}' not found.`);
    
    const key = `gameState:${resolvedRoomId}`;
    const json = await redis.get<string>(key);
    
    // Check if json is valid
    if (!json) throw new Error(`Game state not found for room ${resolvedRoomId}`);
    
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
}

export const storage = new RedisStorage();
