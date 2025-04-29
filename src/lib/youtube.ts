const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Types for YouTube API responses
export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Search for videos via backend proxy
export async function searchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  try {
    const url = new URL('/api/youtube/search', window.location.origin);
    url.searchParams.append('q', query);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to search YouTube videos');
    }
    
    const data = await response.json() as YouTubeSearchResponse;
    return data.items;
  } catch (error) {
    console.error("Error searching YouTube videos:", error);
    throw new Error('Failed to search YouTube videos');
  }
}

// Get video details via backend proxy
export async function getYouTubeVideo(videoId: string): Promise<YouTubeVideo> {
  try {
    const url = new URL('/api/youtube/video', window.location.origin);
    url.searchParams.append('id', videoId);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to get YouTube video');
    }
    
    const data = await response.json();
    return data.items[0];
  } catch (error) {
    console.error("Error getting YouTube video:", error);
    throw new Error('Failed to get YouTube video');
  }
}

// Extract artist and song title from YouTube video title
export function parseYouTubeTitle(title: string): { artist: string; title: string } {
  // Try to match patterns like "Artist - Title" or "Title by Artist"
  const dashPattern = /^(.*?)\s*-\s*(.*?)$/;
  const byPattern = /^(.*?)\s*by\s*(.*?)$/i;
  
  let artist = '';
  let songTitle = title;
  
  const dashMatch = title.match(dashPattern);
  if (dashMatch) {
    artist = dashMatch[1].trim();
    songTitle = dashMatch[2].trim();
  } else {
    const byMatch = title.match(byPattern);
    if (byMatch) {
      songTitle = byMatch[1].trim();
      artist = byMatch[2].trim();
    }
  }
  
  // Remove common suffixes like "(Official Video)" or "[Lyric Video]"
  songTitle = songTitle
    .replace(/\(Official\s*Video\)/i, '')
    .replace(/\[Official\s*Video\]/i, '')
    .replace(/\(Lyric\s*Video\)/i, '')
    .replace(/\[Lyric\s*Video\]/i, '')
    .replace(/\(Audio\)/i, '')
    .replace(/\[Audio\]/i, '')
    .replace(/\(Official\s*Audio\)/i, '')
    .replace(/\[Official\s*Audio\]/i, '')
    .trim();
  
  return { artist, title: songTitle };
}
