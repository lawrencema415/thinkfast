import { NextResponse } from "next/server";
import { storage, getSession } from "../storage";

export async function GET() {
  try {
    const sessionId = await getSession();
    console.log('Retrieved session ID:', sessionId); // Add this log
    
    if (!sessionId) {
      console.log('No session ID found');
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!/^\d+$/.test(sessionId)) {
      console.log('Invalid session ID format:', sessionId);
      return NextResponse.json(
        { error: "Invalid session format" },
        { status: 400 }
      );
    }
    
    const userId = parseInt(sessionId, 10);
    console.log('Parsed user ID:', userId); // Add this log
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Log successful user fetch
    console.log('Successfully fetched user:', user.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}