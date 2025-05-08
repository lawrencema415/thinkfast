const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
// const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com/api/token';

// Types for Spotify API responses
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    next: string | null;
    total: number;
  };
}

// Get client credentials token via backend proxy
async function getSpotifyToken() {
  try {
    const response = await fetch('/api/spotify/token');
    
    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching Spotify token:", error);
    throw new Error('Failed to get Spotify access token');
  }
}

// Search for tracks
export async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();
  
  const url = new URL(`${SPOTIFY_API_BASE}/search`);
  url.searchParams.append('q', query);
  url.searchParams.append('type', 'track');
  url.searchParams.append('limit', '10');
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to search Spotify tracks');
  }
  
  const data = await response.json() as SpotifySearchResponse;
  return data.tracks.items;
}
