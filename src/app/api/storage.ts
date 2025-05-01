import { Redis } from '@upstash/redis';
import {
  type Room,
  type RoomPlayer,
  type InsertRoomPlayer,
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
    const room = await redis.hgetall(`room:${id}`);
    return room ? room as Room : undefined;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const roomId = await redis.get(`roomCode:${code}`);
    if (!roomId) return undefined;
    return this.getRoom(roomId as string);
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
    return player;
  }

  async getPlayersInRoom(roomId: string): Promise<RoomPlayer[]> {
    const playerIds = await redis.smembers(`room:${roomId}:players`);
    const players = await Promise.all(
      playerIds.map(id => redis.hgetall(`player:${id}`))
    );
    return players.filter(Boolean) as RoomPlayer[];
  }
}

export const storage = new RedisStorage();
