import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";
import { z } from "zod";
import { insertRoomSchema, insertSongSchema, insertGuessSchema } from "../../shared/schema";
import { generateRandomString } from "@/lib/utils";
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { previewCache, getPreviewCacheKey } from './cache';

dotenv.config();

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Set up game WebSocket handlers
  setupWebSocket(wss, storage);
  
  // Room routes
  app.post("/api/rooms", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validatedData = insertRoomSchema.parse({
        ...req.body,
        hostId: req.user.id,
        code: generateRandomString(6)
      });
      
      const room = await storage.createRoom(validatedData);
      
      await storage.addPlayerToRoom({
        roomId: room.id,
        userId: req.user.id
      });
      
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid room data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });
  
  app.post("/api/rooms/:code/join", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { code } = req.params;
      const room = await storage.getRoomByCode(code);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const player = await storage.addPlayerToRoom({
        roomId: room.id,
        userId: req.user.id
      });
      
      res.status(200).json({ room, player });
    } catch (error) {
      res.status(500).json({ message: "Failed to join room" });
    }
  });
  
  app.post("/api/rooms/leave", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const { roomId, isHost, nextHostId } = req.body;
      
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      if (isHost && nextHostId) {
        await storage.updateRoom(roomId, { hostId: nextHostId });
        await storage.addMessage({
          roomId,
          userId,
          content: "Host has left, new host assigned",
          type: "system"
        });
      }
      
      await storage.removePlayerFromRoom(userId, roomId);
      const remainingPlayers = await storage.getPlayersInRoom(roomId);
      
      if (remainingPlayers.length === 0 || (isHost && !nextHostId)) {
        const songs = await storage.getSongsForRoom(roomId);
        for (const song of songs) {
          await storage.removeSong(song.id);
        }
        await storage.deleteRoom(roomId);
      }
      
      res.status(200).json({ message: "Left room successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to leave room" });
    }
  });
  
  // Songs routes
  app.post("/api/songs", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const players = Array.from(storage.roomPlayers.values());
      const player = players.find(p => p.userId === req.user.id);
      
      if (!player) {
        return res.status(404).json({ message: "You are not in any active room" });
      }
      
      const room = await storage.getRoom(player.roomId);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      
      if (player.songsAdded >= room.songsPerPlayer) {
        return res.status(400).json({ 
          message: `You have already added the maximum of ${room.songsPerPlayer} songs` 
        });
      }
      
      const validatedData = insertSongSchema.parse({
        ...req.body,
        roomId: player.roomId,
        userId: req.user.id
      });
      
      const song = await storage.addSong(validatedData);
      res.status(201).json(song);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid song data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to add song" });
    }
  });
  
  // Guess routes
  app.post("/api/guesses", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const validatedData = insertGuessSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const guess = await storage.recordGuess(validatedData);
      res.status(201).json(guess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid guess data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to record guess" });
    }
  });
  
  // Game state route
  app.get("/api/game/state", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const players = Array.from((await storage).roomPlayers.values());
      const player = players.find(p => p.userId === userId);
      
      if (!player) {
        return res.status(200).json(null);
      }
      
      const room = await storage.getRoom(player.roomId);
      if (!room || !room.isActive) {
        return res.status(200).json(null);
      }
      
      const roomPlayers = players.filter(p => p.roomId === room.id);
      const playersWithUsers = await Promise.all(
        roomPlayers.map(async p => {
          const user = await storage.getUser(p.userId);
          return { ...p, user: user! };
        })
      );
      
      const songs = await storage.getSongsForRoom(room.id);
      const messages = await storage.getMessagesForRoom(room.id);
      
      res.status(200).json({
        room,
        players: playersWithUsers,
        currentTrack: null,
        songQueue: songs,
        currentRound: 0,
        totalRounds: songs.length,
        timeRemaining: room.timePerSong,
        isPlaying: room.isPlaying,
        messages
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get game state" });
    }
  });
  
  // Game control routes
  app.post("/api/game/start", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const players = Array.from((await storage).roomPlayers.values());
      const player = players.find(p => p.userId === userId);
      
      if (!player) {
        return res.status(404).json({ message: "You are not in any active room" });
      }
      
      const room = await storage.getRoom(player.roomId);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: "Room not found or inactive" });
      }
      
      if (room.hostId !== userId) {
        return res.status(403).json({ message: "Only the host can start the game" });
      }
      
      const roomPlayers = players.filter(p => p.roomId === room.id);
      const allPlayersReady = roomPlayers.every(p => p.songsAdded >= room.songsPerPlayer);
      
      if (!allPlayersReady) {
        return res.status(400).json({ 
          message: "All players must add their songs before starting" 
        });
      }
      
      await storage.updateRoom(room.id, { isActive: true, isPlaying: true });
      res.status(200).json({ message: "Game started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });
  
  app.post("/api/game/play-again", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const players = Array.from((await storage).roomPlayers.values());
      const player = players.find(p => p.userId === userId);
      
      if (!player) {
        return res.status(404).json({ message: "You are not in any active room" });
      }
      
      const room = await storage.getRoom(player.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      if (room.hostId !== userId) {
        return res.status(403).json({ message: "Only the host can restart the game" });
      }
      
      const roomPlayers = players.filter(p => p.roomId === room.id);
      for (const player of roomPlayers) {
        await storage.updatePlayerScore(player.id, 0);
      }
      
      const songs = await storage.getSongsForRoom(room.id);
      for (const song of songs) {
        await storage.updateSong(song.id, { isPlayed: false });
      }
      
      await storage.addMessage({
        roomId: room.id,
        userId: userId,
        content: "Game restarted",
        type: "system"
      });
      
      res.status(200).json({ message: "Game restarted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to restart game" });
    }
  });
  
  app.post("/api/game/end", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { roomId } = req.body;
      if (!roomId) {
        return res.status(400).json({ message: "Room ID is required" });
      }

      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.hostId !== req.user.id) {
        return res.status(403).json({ message: "Only the host can end the game" });
      }

      await storage.updateRoom(roomId, { isActive: true, isPlaying: false });
      res.status(200).json({ message: "Game ended successfully" });
    } catch (error) {
      console.error('Error ending game:', error);
      res.status(500).json({ message: "Failed to end game" });
    }
  });

  // Spotify integration routes
  let cachedToken: string | null = null;
  let tokenExpiry: number | null = null;

  app.get("/api/spotify/token", async (_req: Request, res: Response) => {
    const now = Date.now();

    if (cachedToken && tokenExpiry && now < tokenExpiry) {
      return res.json({ access_token: cachedToken });
    }

    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "Spotify API credentials not found" });
      }
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!response.ok) {
        return res.status(500).json({ error: "Failed to get Spotify access token" });
      }
      
      const data = await response.json();
      cachedToken = data.access_token;
      tokenExpiry = now + (data.expires_in * 1000);
      res.json({access_token: cachedToken});
    } catch (error) {
      console.error("Error getting Spotify token:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function createSpotifyApi() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
    if (!clientId || !clientSecret) {
      throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required');
    }
  
    return new SpotifyWebApi({
      clientId: clientId,
      clientSecret: clientSecret
    });
  }

  async function getSpotifyLinks(id: string) {
    try {
      const spotifyUrl = `https://open.spotify.com/track/${id}`;
      const response = await axios.get(spotifyUrl);
      const html = response.data;
      const $ = cheerio.load(html);
      const scdnLinks = new Set<string>();
  
      $('*').each((i, element) => {
        const attrs = element.attribs;
        Object.values(attrs).forEach(value => {
          if (value && value.includes('p.scdn.co')) {
            scdnLinks.add(value);
          }
        });
      });
  
      return Array.from(scdnLinks);
    } catch (error) {
      throw new Error(`Failed to fetch preview URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function getPreviewUrl(trackId: string) {
    try {
      if (!trackId) {
        throw new Error('Track ID is required');
      }
  
      const spotifyApi = createSpotifyApi();
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      
      const track = await spotifyApi.getTrack(trackId);
      
      if (!track.body) {
        return {
          success: false,
          error: 'Track not found',
          result: null
        };
      }
  
      const previewUrls = await getSpotifyLinks(trackId);
      
      return {
        success: true,
        result: {
          name: `${track.body.name} - ${track.body.artists.map(artist => artist.name).join(', ')}`,
          spotifyUrl: track.body.external_urls.spotify,
          previewUrls: previewUrls
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        result: null
      };
    }
  }

  app.get('/api/spotify/preview/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
  
    if (!id) {
      return res.status(400).json({ error: 'Missing track ID parameter' });
    }
  
    try {
      const result = await getPreviewUrl(id);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/spotify/preview:', error.message);
      res.status(500).json({ error: 'Failed to fetch preview URLs' });
    }
  });

  app.post("/api/spotify/previews", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      const enrichedTracks = [];
  
      for (const id of ids) {
        const cacheKey = getPreviewCacheKey(id);
        const cachedPreview = previewCache.get<string>(cacheKey);
  
        if (cachedPreview) {
          enrichedTracks.push({
            id,
            preview_url: cachedPreview
          });
          continue;
        }
  
        const previewUrls = await getSpotifyLinks(id);
        const preview_url = previewUrls[0] || null;
  
        if (preview_url) {
          previewCache.set(cacheKey, preview_url);
        }
  
        enrichedTracks.push({
          id,
          preview_url
        });
      }
  
      res.json({ enrichedTracks });
    } catch (error) {
      console.error('Error fetching preview URLs:', error);
      res.status(500).json({ error: 'Failed to fetch preview URLs' });
    }
  });
  
  // YouTube integration routes
  app.get("/api/youtube/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "YouTube API key not found" });
      }
      
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('maxResults', '10');
      url.searchParams.append('q', query);
      url.searchParams.append('type', 'video');
      url.searchParams.append('videoCategoryId', '10');
      url.searchParams.append('key', apiKey);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to search YouTube videos" });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching YouTube videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/api/youtube/video", async (req: Request, res: Response) => {
    try {
      const videoId = req.query.id as string;
      
      if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
      }
      
      const apiKey = process.env.YOUTUBE_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "YouTube API key not found" });
      }
      
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('id', videoId);
      url.searchParams.append('key', apiKey);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to get YouTube video" });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error getting YouTube video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
} 