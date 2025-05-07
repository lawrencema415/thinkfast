import { NextResponse } from 'next/server';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function GET() {
  const now = Date.now();

  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return NextResponse.json({ access_token: cachedToken });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Spotify credentials missing' }, { status: 500 });
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }

  const data = await tokenResponse.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;

  return NextResponse.json({ access_token: cachedToken });
}
