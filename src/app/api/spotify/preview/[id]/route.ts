import { NextRequest, NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

function createSpotifyApi() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are required');
  }

  return new SpotifyWebApi({ clientId, clientSecret });
}

async function getSpotifyLinks(trackId: string) {
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

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'Missing track ID' }, { status: 400 });
  }

  try {
    const spotifyApi = createSpotifyApi();
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);

    const track = await spotifyApi.getTrack(id);
    const previewUrls = await getSpotifyLinks(id);

    return NextResponse.json({
      success: true,
      result: {
        name: `${track.body.name} - ${track.body.artists.map(a => a.name).join(', ')}`,
        spotifyUrl: track.body.external_urls.spotify,
        previewUrls,
      },
    });
  } catch (err) {
    console.error('Preview error:', err);
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}
