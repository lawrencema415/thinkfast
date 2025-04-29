import { NextResponse } from "next/server";
import { clearSession } from "../../storage";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
