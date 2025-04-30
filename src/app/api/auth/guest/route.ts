import { NextRequest, NextResponse } from "next/server";
import { storage, setSession } from "../../storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Create a new guest user
    const user = await storage.createUser({
      username,
      avatarUrl: null
    });

    // Set session
    await setSession(user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Guest user creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
