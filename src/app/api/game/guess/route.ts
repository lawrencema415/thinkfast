import { NextResponse } from "next/server";
import { storage } from "../../storage";
import { isEmpty } from "lodash";
import { SYSTEM_MESSAGE_TYPE } from "@/shared/schema";

const calculateScore = (timeElapsed: number, totalTime: number): number => {
  const speedRatio = 1 - Math.min(timeElapsed / totalTime, 1);
  const speedBonus = Math.round(speedRatio * 50);
  return 50 + speedBonus;
};

const WINNER_BONUS = 1.5;
export async function POST(req: Request) {
  try {
    const {
      currentTime,
      guess,
      roomCode,
      round: roundData,
      timePerSong,
      userId,
    } = await req.json();

    // Validate required fields
    if (
      !roomCode ||
      !guess ||
      !userId ||
      !roundData ||
      !currentTime ||
      !timePerSong
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const gameState = await storage.getGameStateByRoomCode(roomCode);
    const roomId = await storage.getRoomByCode(roomCode);

    if (!gameState || !roomId) {
      return NextResponse.json(
        { error: "Game or room not found" },
        { status: 404 }
      );
    }

    const { round } = gameState;

    if (!round) {
      return NextResponse.json(
        { error: "Current round not found" },
        { status: 404 }
      );
    }

    // Ensure startedAt is a Date object
    const startedAt =
    round.startedAt instanceof Date
        ? round.startedAt
        : new Date(round.startedAt);

    // Prevent duplicate guesses
    const hasGuessed = round.guesses.some(
      (g) => g.userId === userId
    );
    if (hasGuessed) {
      return NextResponse.json(
        { message: "Player has already guessed this round", success: true },
        { status: 200 }
      );
    }

    const timeElapsed = currentTime - startedAt.getTime();
    const totalTime = timePerSong * 1000;

    let score = calculateScore(timeElapsed, totalTime);

    // Add guess (props sorted alphabetically)
    round.guesses.push({
      guess,
      isCorrect: true,
      timestamp: new Date(),
      userId,
    });

    // First correct guess gets double points
    if (isEmpty(round.winnerId)) {
      round.winnerId = userId;
      score *= WINNER_BONUS;
    }

    let displayName = '';
    // Update player score (props sorted alphabetically)
    gameState.players = gameState.players.map((player) => {
      if (player.user.id === userId) {
        displayName = player.user.user_metadata?.display_name;
        return {
          ...player,
          score: player.score + score,
        };
      }
      return player;
    });

    const messages = await storage.getMessagesByRoomCode(roomCode);

    messages.push({
      content: `${displayName} has guessed the song name!`,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      roomId: roomId,
      type: SYSTEM_MESSAGE_TYPE,
    });

    await storage.saveGameAndMessages(roomId, gameState, messages);

    return NextResponse.json(gameState);
  } catch (error) {
    console.error("Error in /guess route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
