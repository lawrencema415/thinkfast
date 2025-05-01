import { z } from "zod";

// User model
export const userSchema = z.object({
  id: z.string(), // Changed from number to string as Supabase uses UUID
  email: z.string().email(),
});

export const insertUserSchema = z.object({
  id: z.string(), // Added ID field since Supabase provides it
  email: z.string().email(),
});

// Room model
export const roomSchema = z.object({
  id: z.number(),
  code: z.string(),
  hostId: z.string(), // Changed from number to string to match User id type
  songsPerPlayer: z.number(),
  timePerSong: z.number(), // in seconds
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  isPlaying: z.boolean().default(false)
});

export const insertRoomSchema = z.object({
  code: z.string(),
  hostId: z.number(),
  songsPerPlayer: z.number(),
  timePerSong: z.number()
});

// RoomPlayer model to track players in a room
export const roomPlayerSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  userId: z.string(), // Changed from number to string to match User id type
  score: z.number().default(0),
  songsAdded: z.number().default(0),
  joinedAt: z.date()
});

export const insertRoomPlayerSchema = z.object({
  roomId: z.number(),
  userId: z.number()
});

// Song model
export const songSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  userId: z.number(),
  title: z.string(),
  artist: z.string(),
  albumArt: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  sourceType: z.string(), // "spotify" or "youtube"
  sourceId: z.string(),
  isPlayed: z.boolean().default(false),
  createdAt: z.date(),
  previewUrl: z.string().optional().nullable()
});

export const insertSongSchema = z.object({
  roomId: z.number(),
  userId: z.number(),
  title: z.string(),
  artist: z.string(),
  albumArt: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  sourceType: z.string(),
  sourceId: z.string(),
  previewUrl: z.string().optional().nullable()
});

// Guess model
export const guessSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  songId: z.number(),
  userId: z.number(),
  content: z.string(),
  isCorrect: z.boolean().default(false),
  points: z.number().default(0),
  guessTime: z.number().optional().nullable(), // time in seconds from when song started
  createdAt: z.date()
});

export const insertGuessSchema = z.object({
  roomId: z.number(),
  songId: z.number(),
  userId: z.number(),
  content: z.string(),
  isCorrect: z.boolean().optional()
});

// Message model for chat
export const messageSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  userId: z.number(),
  content: z.string(),
  type: z.string().default("chat"), // "chat", "system", "guess"
  createdAt: z.date()
});

export const insertMessageSchema = z.object({
  roomId: z.number(),
  userId: z.number(),
  content: z.string(),
  type: z.string().optional()
});

// Define types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = z.infer<typeof roomSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type RoomPlayer = z.infer<typeof roomPlayerSchema>;
export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;

export type Song = z.infer<typeof songSchema>;
export type InsertSong = z.infer<typeof insertSongSchema>;

export type Guess = z.infer<typeof guessSchema>;
export type InsertGuess = z.infer<typeof insertGuessSchema>;

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Additional types for client-server communication
export type GameState = {
  room: Room;
  players: PlayerWithUser[];
  currentTrack: Song | null;
  songQueue: Song[];
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  isPlaying: boolean;
  messages: Message[];
  countdown: {
    isActive: boolean;
    timeRemaining: number;
    startTime: number;
  };
  currentSongTimestamp: number | null;
  waitingForNextRound: boolean;
};

export type PlayerWithUser = RoomPlayer & { user: User };
