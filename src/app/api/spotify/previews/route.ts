import { NextRequest, NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

const previewCache = new Map<string, string>();

function getPreviewCacheKey(id: string) {
  return `preview:${id}`;
}

function createSpotifyApi() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are required');
  }

  return new SpotifyWebApi({ clientId, clientSecret });
}

async function getSpotifyLinks(trackId: string): Promise<string[]> {
  const response = await axios.get(`https://open.spotify.com/track/${trackId}`);
  const $ = cheerio.load(response.data);
  const links = new Set<string>();

  $('*').each((_, el) => {
    const element = el as Element;
    Object.values(element.attribs || {}).forEach((val: string) => {
      if (val.includes('p.scdn.co')) links.add(val);
    });
  });

  return Array.from(links);
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);

    // Search for tracks
    const searchRes = await spotifyApi.searchTracks(query, { limit: 10 });
    const tracks = searchRes.body.tracks?.items || [];

    // For each track, get preview_url (from API) or scrape if missing
    const enrichedTracks = await Promise.all(
      tracks.map(async (track) => {
        let preview_url = track.preview_url;
        if (!preview_url) {
          const cacheKey = getPreviewCacheKey(track.id);
          const cached = previewCache.get(cacheKey);

          if (cached) {
            preview_url = cached;
          } else {
            const links = await getSpotifyLinks(track.id);
            preview_url = links[0] || null;
            if (preview_url) previewCache.set(cacheKey, preview_url);
          }
        }
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => ({ name: a.name })),
          album: {
            name: track.album.name,
            images: track.album.images,
          },
          preview_url,
          external_urls: track.external_urls,
        };
      })
    );

    return NextResponse.json({ enrichedTracks });
  } catch (err) {
    console.error('Error fetching Spotify tracks/previews:', err);
    return NextResponse.json({ error: 'Failed to fetch Spotify tracks/previews' }, { status: 500 });
  }
}
