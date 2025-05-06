import { z } from "zod";
import { User as SupabaseUser } from '@supabase/supabase-js';

export enum ROLE {
  HOST = 'host',
  PLAYER = 'player'
}

const roleSchema = z.enum([ROLE.HOST, ROLE.PLAYER]);

// Player model
export const playerSchema = z.object({
  user: z.custom<SupabaseUser>(),
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
  title: z.string(),
  albumArt: z.string(),
  sourceType: z.string(),
  previewUrl: z.string(),
  isPlayed: z.boolean().default(false),
  artist: z.string(),
  userId: z.string(),
});

// Message model for chat
export const messageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  content: z.string(),
  type: z.string().default("chat"),
  createdAt: z.date()
});

// GameState model
export const gameStateSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  currentRound: z.number(),
  currentTrack: songSchema.nullable(),
  hostId: z.string(),
  isActive: z.boolean(),
  isPlaying: z.boolean(),
  messages: z.array(messageSchema),
  players: z.array(playerSchema),
  room: roomSchema,
  songs: z.array(songSchema),
  songsPerPlayer: z.number(),
  timePerSong: z.number(),
  timeRemaining: z.number(),
  totalRounds: z.number(),
});
// Define types
export type Player = z.infer<typeof playerSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Song = z.infer<typeof songSchema>;
export type Message = z.infer<typeof messageSchema>;
export type GameState = z.infer<typeof gameStateSchema>;
