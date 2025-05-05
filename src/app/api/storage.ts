import { Redis } from '@upstash/redis';
import {
  type Room,
  type RoomPlayer,
  type InsertRoomPlayer,
  Song,
  Message,
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

  // Room operations
  async createRoom(user: User, options: { songsPerPlayer: number; timePerSong: number }): Promise<Room> {
    const id = this.generateId();
    const code = generateRoomCode();
    const createdAt = new Date();
    const room: Room = {
      id,
      code,
      players: [{
        user,
        role: 'host'
      }],
      hostId: user.id,
      songsPerPlayer: options.songsPerPlayer,
      timePerSong: options.timePerSong,
      isActive: true,
      isPlaying: false,
      createdAt
    };

    await redis.hset(`room:${id}`, room);
    await redis.set(`roomCode:${code}`, id);
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    // const uuid = await redis.get(`roomCode:${id}`);
    // const room = await redis.hgetall(`room:${uuid}`);
    const room = await redis.hgetall(`room:${id}`);
    return room ? room as Room : undefined;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    // console.log('Looking up room with code:', code);
    const roomId = await redis.get(`roomCode:${code}`);
    // console.log('Found roomId:', roomId);
    if (!roomId) return undefined;
    const room = await this.getRoom(roomId as string);
    // console.log('Found room:', room);
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const room = await this.getRoom(id);
    if (!room) throw new Error(`Room with id ${id} not found`);

    const updatedRoom = { ...room, ...updates };
    await redis.hset(`room:${id}`, updatedRoom);
    return updatedRoom;
  }

  // Player operations
  async addPlayerToRoom(insertPlayer: InsertRoomPlayer): Promise<RoomPlayer> {
    // console.log('attempt to add player to room', insertPlayer);
    const id = this.generateId();
    const player: RoomPlayer = {
      ...insertPlayer,
      id,
      score: 0,
      songsAdded: 0,
      joinedAt: new Date()
    };

    await redis.hset(`player:${id}`, player);
    await redis.sadd(`room:${insertPlayer.roomId}:players`, id);
    // console.log('added player', player)
    return player;
  }

  async getPlayersInRoom(roomId: string): Promise<RoomPlayer[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];
  
    const playerIds = await redis.smembers(`room:${resolvedRoomId}:players`);
    const players = await Promise.all(
      playerIds.map(id => redis.hgetall(`player:${id}`))
    );
    return players.filter(p => p && Object.keys(p).length > 0) as RoomPlayer[];
}

  async getSongsForRoom(roomId: string): Promise<Song[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];

    const songIds = await redis.smembers(`room:${resolvedRoomId}:songs`);
    const songs = await Promise.all(
      songIds.map(id => redis.hgetall(`song:${id}`))
    );
    return songs.filter(Boolean) as Song[];
  }

  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    const resolvedRoomId = await this.resolveRoomId(roomId);
    if (!resolvedRoomId) return [];

    const messageIds = await redis.smembers(`room:${resolvedRoomId}:messages`);
    const messages = await Promise.all(
      messageIds.map(id => redis.hgetall(`message:${id}`))
    );
    return messages.filter(Boolean) as Message[];
  }

  async addSongToRoom(roomId: string, song: Omit<Song, 'id'>): Promise<Song> {
    const id = this.generateId();
    const newSong = {
      ...song,
      id,
      isPlayed: false
    };

    await redis.hset(`song:${id}`, newSong);
    await redis.sadd(`room:${roomId}:songs`, id);
    return newSong;
  }

  async addMessageToRoom(roomId: string, message: Omit<Message, 'id'>): Promise<Message> {
    const id = this.generateId();
    const newMessage = {
      ...message,
      id,
      timestamp: new Date()
    };

    await redis.hset(`message:${id}`, newMessage);
    await redis.sadd(`room:${roomId}:messages`, id);
    return newMessage;
  }

  async removePlayerFromRoom(roomId: string, userId: string): Promise<void> {
      console.log('Removing player from room:', roomId, userId);
      // Get all player IDs for the room
      const playerIds = await redis.smembers(`room:${roomId}:players`);
      
      // Find the player ID that matches the user ID
      const players = await Promise.all(
          playerIds.map(id => redis.hgetall(`player:${id}`))
      );
      
      const playerToRemove = players.find(p => p?.userId === userId);
      
      if (playerToRemove) {
          // Remove player from the room's player set
          await redis.srem(`room:${roomId}:players`, playerToRemove.id);
          // Delete the player's hash
          await redis.del(`player:${playerToRemove.id}`);
      }
  }
}

export const storage = new RedisStorage();
