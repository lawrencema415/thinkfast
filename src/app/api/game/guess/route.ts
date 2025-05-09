export async function POST(req: Request) {
  console.log(req);
  // const { roomCode, guess, userId } = await req.json();
  // 1. Fetch gameState
  // 2. Record the guess in the current round
  // 3. If all eligible players have guessed:
  //    - Mark round as complete
  //    - Set a "nextRoundAt" timestamp = now + 2s in gameState
  //    - Optionally, trigger a background job or setTimeout to call next round
  // 4. Save gameState
  // 5. Return updated gameState
}
