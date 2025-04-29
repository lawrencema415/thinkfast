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

    // Check if user exists
    let user = await storage.getUserByUsername(username);

    // If user doesn't exist, create a new one
    if (!user) {
      user = await storage.createUser({
        username,
        avatarUrl: null
      });
    }

    // Set session
    await setSession(user.id);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 