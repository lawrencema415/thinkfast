import { GameState, Player, Track } from '@shared/schema';

export const eventHandlers = {
  connected: (event: MessageEvent, setIsConnected: (value: boolean) => void) => {
    setIsConnected(true);
    console.log('SSE Connected:', JSON.parse(event.data));
  },

  playerJoined: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { player: Player };
    setGameState(prev => ({
      ...prev,
      players: [...(prev?.players || []), data.player]
    }));
    console.log('Player joined:', data);
  },

  playerLeft: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { player: Player };
    setGameState(prev => ({
      ...prev,
      players: prev?.players.filter(p => p.id !== data.player.id) || []
    }));
    console.log('Player left:', data);
  },

  gameStarted: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { track: Track };
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      currentRound: 1,
      currentTrack: data.track
    }));
    console.log('Game started:', data);
  },

  roundUpdate: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { round: number; track: Track };
    setGameState(prev => ({
      ...prev,
      currentRound: data.round,
      currentTrack: data.track
    }));
    console.log('Round updated:', data);
  },

  correctGuess: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { player: Player; points: number };
    setGameState(prev => ({
      ...prev,
      players: prev?.players.map(p => 
        p.id === data.player.id 
          ? { ...p, score: (p.score || 0) + data.points }
          : p
      ) || []
    }));
    console.log('Correct guess:', data);
  },

  gameEnded: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { winners: Player[] };
    setGameState(prev => ({
      ...prev,
      status: 'completed',
      winners: data.winners
    }));
    console.log('Game ended:', data);
  },

  roomUpdate: (event: MessageEvent, setGameState: (updater: (prev: GameState | null) => GameState | null) => void) => {
    const data = JSON.parse(event.data) as { room: GameState['room'] };
    setGameState(prev => ({
      ...prev,
      room: data.room
    }));
    console.log('Room updated:', data);
  },

  ping: (event: MessageEvent) => {
    console.log('Ping received:', JSON.parse(event.data));
  }
};