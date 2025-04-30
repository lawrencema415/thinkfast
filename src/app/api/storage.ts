import {
  type User,
  type InsertUser,
  type Room,
  type InsertRoom,
  type RoomPlayer,
  type InsertRoomPlayer,
  type Song,
  type InsertSong,
  type Guess,
  type InsertGuess,
  type Message,
  type InsertMessage
} from "../../shared/schema";
import { cookies } from "next/headers";

// In-memory storage for development
// Note: This will reset when the server restarts
// For production, consider using a more persistent solution like Redis
export class MemStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private roomPlayers: Map<number, RoomPlayer>;
  private songs: Map<number, Song>;
  private guesses: Map<number, Guess>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private roomIdCounter: number;
  private roomPlayerIdCounter: number;
  private songIdCounter: number;
  private guessIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.roomPlayers = new Map();
    this.songs = new Map();
    this.guesses = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.roomIdCounter = 1;
    this.roomPlayerIdCounter = 1;
    this.songIdCounter = 1;
    this.guessIdCounter = 1;
    this.messageIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      avatarUrl: insertUser.avatarUrl ?? null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Room operations
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomIdCounter++;
    const createdAt = new Date();
    const room: Room = { 
      ...insertRoom, 
      id, 
      isActive: true, 
      isPlaying: false,
      createdAt 
    };
    this.rooms.set(id, room);
    return room;
  }
  
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }
  
  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.code === code && room.isActive,
    );
  }
  
  async updateRoom(id: number, updates: Partial<Room>): Promise<Room> {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Room with id ${id} not found`);
    }
    
    const updatedRoom: Room = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  // RoomPlayer operations
  async addPlayerToRoom(insertPlayer: InsertRoomPlayer): Promise<RoomPlayer> {    
    // Check if player is already in the room
    const existingPlayer = Array.from(this.roomPlayers.values()).find(
      (player) => player.userId === insertPlayer.userId && player.roomId === insertPlayer.roomId,
    );
    
    if (existingPlayer) {
      console.log('Player already in room:', existingPlayer);
      return existingPlayer;
    }
    
    const id = this.roomPlayerIdCounter++;
    const joinedAt = new Date();
    const player: RoomPlayer = { 
      ...insertPlayer, 
      id, 
      score: 0, 
      songsAdded: 0, 
      joinedAt 
    };
    
    console.log('Created new player:', player);
    this.roomPlayers.set(id, player);
    return player;
  }
  
  async getPlayersInRoom(roomId: number): Promise<RoomPlayer[]> {
    return Array.from(this.roomPlayers.values()).filter(
      (player) => player.roomId === roomId,
    );
  }
  
  async updatePlayerScore(id: number, score: number): Promise<RoomPlayer> {
    const player = this.roomPlayers.get(id);
    if (!player) {
      throw new Error(`Player with id ${id} not found`);
    }
    
    const updatedPlayer: RoomPlayer = { ...player, score };
    this.roomPlayers.set(id, updatedPlayer);
    return updatedPlayer;
  }
  
  async removePlayerFromRoom(userId: number, roomId: number): Promise<void> {
    const player = Array.from(this.roomPlayers.values()).find(
      (player) => player.userId === userId && player.roomId === roomId,
    );
    
    if (player) {
      this.roomPlayers.delete(player.id);
    }
  }
  
  async updatePlayerSongsAdded(userId: number, roomId: number, songsAdded: number): Promise<RoomPlayer> {
    const player = Array.from(this.roomPlayers.values()).find(
      (player) => player.userId === userId && player.roomId === roomId,
    );
    
    if (!player) {
      throw new Error(`Player with userId ${userId} in room ${roomId} not found`);
    }
    
    const updatedPlayer: RoomPlayer = { ...player, songsAdded };
    this.roomPlayers.set(player.id, updatedPlayer);
    return updatedPlayer;
  }
  
  // Song operations
  async addSong(insertSong: InsertSong): Promise<Song> {
    const id = this.songIdCounter++;
    const createdAt = new Date();
    const song: Song = { 
      ...insertSong, 
      id, 
      isPlayed: false, 
      createdAt,
      albumArt: insertSong.albumArt ?? null,
      genre: insertSong.genre ?? null,
      previewUrl: insertSong.previewUrl ?? null
    };
    this.songs.set(id, song);
    
    // Update player's songsAdded count
    const player = Array.from(this.roomPlayers.values()).find(
      (player) => player.userId === insertSong.userId && player.roomId === insertSong.roomId,
    );
    
    if (player) {
      const songsAdded = player.songsAdded ? player.songsAdded + 1 : 1;
      await this.updatePlayerSongsAdded(player.userId, player.roomId, songsAdded);
    }
    
    return song;
  }
  
  async getSongsForRoom(roomId: number): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.roomId === roomId,
    );
  }
  
  async getSongById(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }
  
  async updateSong(id: number, updates: Partial<Song>): Promise<Song> {
    const song = this.songs.get(id);
    if (!song) {
      throw new Error(`Song with id ${id} not found`);
    }
    
    const updatedSong: Song = { ...song, ...updates };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }
  
  async removeSong(id: number): Promise<void> {
    const song = this.songs.get(id);
    if (!song) {
      console.warn(`Attempted to remove a song that doesn't exist with id: ${id}`);
      return;
    }
  
    this.songs.delete(id);
  
    const player = Array.from(this.roomPlayers.values()).find(
      (p) => p.userId === song.userId && p.roomId === song.roomId
    );
  
    if (player) {
      // Always decrement songsAdded by 1, but not below 0
      const currentSongsAdded = typeof player.songsAdded === "number" ? player.songsAdded : 0;
      const updatedSongsAdded = Math.max(0, currentSongsAdded - 1);
      await this.updatePlayerSongsAdded(player.userId, player.roomId, updatedSongsAdded);
    } else {
      console.warn(`Player not found for userId: ${song.userId}, roomId: ${song.roomId}`);
    }
  }
  
  // Guess operations
  async recordGuess(insertGuess: InsertGuess): Promise<Guess> {
    const id = this.guessIdCounter++;
    const createdAt = new Date();
    const guess: Guess = { 
      ...insertGuess, 
      id, 
      isCorrect: false, 
      points: 0, 
      guessTime: 0,
      createdAt 
    };
    
    this.guesses.set(id, guess);
    return guess;
  }
  
  async getGuessesForSong(songId: number): Promise<Guess[]> {
    return Array.from(this.guesses.values()).filter(
      (guess) => guess.songId === songId,
    );
  }
  
  async updateGuess(id: number, updates: Partial<Guess>): Promise<Guess> {
    const guess = this.guesses.get(id);
    if (!guess) {
      throw new Error(`Guess with id ${id} not found`);
    }
    
    const updatedGuess: Guess = { ...guess, ...updates };
    this.guesses.set(id, updatedGuess);
    return updatedGuess;
  }
  
  // Message operations
  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const createdAt = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt,
      type: insertMessage.type ?? "chat"
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesForRoom(roomId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        return aTime - bTime;
      });
  }
  
  async deleteRoom(id: number): Promise<void> {
    const room = this.rooms.get(id);
    if (!room) {
      console.warn(`Attempted to delete a room that doesn't exist with id: ${id}`);
      return;
    }

    // Mark room as inactive instead of deleting
    await this.updateRoom(id, { isActive: false });

    // Get all players in the room
    const players = await this.getPlayersInRoom(id);
    
    // Remove all players from the room
    for (const player of players) {
      await this.removePlayerFromRoom(player.userId, id);
    }

    // Get and remove all songs in the room
    const songs = await this.getSongsForRoom(id);
    for (const song of songs) {
      await this.removeSong(song.id);
    }

    // Get and remove all guesses for the room's songs
    for (const song of songs) {
      const guesses = await this.getGuessesForSong(song.id);
      for (const guess of guesses) {
        this.guesses.delete(guess.id);
      }
    }

    // Remove all messages in the room
    const roomMessages = Array.from(this.messages.values())
      .filter(message => message.roomId === id);
    for (const message of roomMessages) {
      this.messages.delete(message.id);
    }
  }

  async clearSongsFromRoom(roomId: number): Promise<void> {
    try {
      // Get all songs in the room
      const roomSongs = Array.from(this.songs.values())
        .filter(song => song.roomId === roomId);
      
      // Delete each song and update player's songsAdded count
      for (const song of roomSongs) {
        // Get the player who added this song
        const player = Array.from(this.roomPlayers.values())
          .find(p => p.userId === song.userId && p.roomId === roomId);
        
        if (player) {
          // Decrement songsAdded count
          const currentSongsAdded = player.songsAdded || 0;
          await this.updatePlayerSongsAdded(player.userId, roomId, Math.max(0, currentSongsAdded - 1));
        }
        
        // Delete the song
        this.songs.delete(song.id);
      }
    } catch (error) {
      console.error('Error clearing songs from room:', error);
      throw error;
    }
  }

  async clearMessagesFromRoom(roomId: number): Promise<void> {
    try {
      // Get all messages in the room
      const roomMessages = Array.from(this.messages.values())
        .filter(message => message.roomId === roomId);
      
      // Delete each message
      for (const message of roomMessages) {
        this.messages.delete(message.id);
      }
    } catch (error) {
      console.error('Error clearing messages from room:', error);
      throw error;
    }
  }

  // Add this method to the MemStorage class
  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }
}

// Create and export a single instance of MemStorage
export const storage = new MemStorage();

// Session management for Next.js
export const getSession = async () => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  return sessionId;
};

export const setSession = async (userId: number) => {
  const cookieStore = await cookies();
  cookieStore.set('sessionId', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/'
  });
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('sessionId');
};
