import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url").default(""),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatarUrl: true
});

// Room model
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: integer("host_id").notNull(),
  songsPerPlayer: integer("songs_per_player").notNull(),
  timePerSong: integer("time_per_song").notNull(), // in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  isPlaying: boolean("isPlaying").default(false).notNull(),
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  code: true,
  hostId: true,
  songsPerPlayer: true,
  timePerSong: true
});

// RoomPlayer model to track players in a room
export const roomPlayers = pgTable("room_players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").default(0),
  songsAdded: integer("songs_added").default(0),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const insertRoomPlayerSchema = createInsertSchema(roomPlayers).pick({
  roomId: true,
  userId: true
});

// Song model
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  albumArt: text("album_art"),
  genre: text("genre"),
  sourceType: text("source_type").notNull(), // "spotify" or "youtube"
  sourceId: text("source_id").notNull(),
  isPlayed: boolean("is_played").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  previewUrl: text("preview_url")
});

export const insertSongSchema = createInsertSchema(songs).pick({
  roomId: true,
  userId: true,
  title: true,
  artist: true,
  albumArt: true,
  genre: true,
  sourceType: true,
  sourceId: true,
  previewUrl: true
});

// Guess model
export const guesses = pgTable("guesses", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  songId: integer("song_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isCorrect: boolean("is_correct").default(false),
  points: integer("points").default(0),
  guessTime: integer("guess_time"), // time in seconds from when song started
  createdAt: timestamp("created_at").defaultNow()
});

export const insertGuessSchema = createInsertSchema(guesses).pick({
  roomId: true,
  songId: true,
  userId: true,
  content: true,
  isCorrect: true
});

// Message model for chat
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").default("chat"), // "chat", "system", "guess"
  createdAt: timestamp("created_at").defaultNow()
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  userId: true,
  content: true,
  type: true
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type RoomPlayer = typeof roomPlayers.$inferSelect;
export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;

export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;

export type Guess = typeof guesses.$inferSelect;
export type InsertGuess = z.infer<typeof insertGuessSchema>;

export type Message = typeof messages.$inferSelect;
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
