import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

const previewCache = new Map<string, string>();

function getPreviewCacheKey(id: string) {
  return `preview:${id}`;
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
    const { ids } = await req.json();
    const enrichedTracks: { id: string; preview_url: string | null }[] = [];

    for (const id of ids) {
      const cacheKey = getPreviewCacheKey(id);
      const cached = previewCache.get(cacheKey);

      if (cached) {
        enrichedTracks.push({ id, preview_url: cached });
        continue;
      }

      const links = await getSpotifyLinks(id);
      const preview_url = links[0] || null;

      if (preview_url) previewCache.set(cacheKey, preview_url);

      enrichedTracks.push({ id, preview_url });
    }

    return NextResponse.json({ enrichedTracks });
  } catch (err) {
    console.error('Error fetching previews:', err);
    return NextResponse.json({ error: 'Failed to fetch preview URLs' }, { status: 500 });
  }
}
