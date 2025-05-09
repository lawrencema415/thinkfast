import { z } from "zod";

export enum ROLE {
  HOST = 'host',
  PLAYER = 'player'
}

export enum MESSAGE_TYPE {
  CHAT = 'chat',
  GUESS = 'guess'
}

export const SYSTEM_MESSAGE_TYPE = 'system' as const;

const roleSchema = z.enum([ROLE.HOST, ROLE.PLAYER]);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  user_metadata: z.object({
    display_name: z.string().optional().default("OogaBooga"),
    avatarUrl: z.string().optional(),
  }).optional(),
});

// Player model
export const playerSchema = z.object({
  user: userSchema,
  role: roleSchema,
  score: z.number().default(0),
});

// Room model
export const roomSchema = z.object({
  id: z.string(),
  code: z.string(),
});

// Song model
export const songSchema = z.object({
  id: z.string(),
  albumArt: z.string(),
  artist: z.string(),
  previewUrl: z.string(),
  sourceType: z.string(),
  sourceId: z.string(),
  title: z.string(),
  userId: z.string(),
});

// Message model for chat
export const messageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  user: playerSchema,
  content: z.string(),
  type: z.enum([MESSAGE_TYPE.CHAT, MESSAGE_TYPE.GUESS]),
  createdAt: z.string().transform(val => new Date(val))
});

export const systemMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  content: z.string(),
  type: z.literal(SYSTEM_MESSAGE_TYPE),
  createdAt: z.string().transform(val => new Date(val))
});

const roundSchema = z.object({
  roundNumber: z.number(),
  song: songSchema,
  startedAt: z.date(),
  endedAt: z.date().optional(),
  guesses: z.array(
    z.object({
      userId: z.string(),
      guess: z.string(),
      timestamp: z.date(),
      isCorrect: z.boolean(),
    })
  ),
  winnerId: z.string().nullable(),
});

// GameState model
export const gameStateSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  currentRound: z.number(),
  currentTrack: songSchema.nullable(),
  currentTrackStartedAt: z.date().nullable(), // <-- NEW
  hostId: z.string(),
  isActive: z.boolean(),
  isPlaying: z.boolean(),
  messages: z.array(messageSchema),
  players: z.array(playerSchema),
  room: roomSchema,
  songs: z.array(songSchema),
  playedSongIds: z.array(z.string()), // <-- NEW
  rounds: z.array(roundSchema), // <-- NEW
  songsPerPlayer: z.number(),
  timePerSong: z.number(),
  timeRemaining: z.number(),
  totalRounds: z.number(),
  countDown: z.boolean().default(false),
});

export const updateGameSchema = z.object({
  roomCode: z.string(),
  songsPerPlayer: z.number().int().positive().optional(),
  timePerSong: z.number().int().positive().optional()
});

// Define types
export type Player = z.infer<typeof playerSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Song = z.infer<typeof songSchema>;
export type Message = z.infer<typeof messageSchema>;
export type SystemMessage = z.infer<typeof systemMessageSchema>;
export type GameState = z.infer<typeof gameStateSchema>;
export type User = z.infer<typeof userSchema>;