import { useState, useRef, useEffect } from "react";
import { Song, User } from "@shared/schema";
import { MusicWave } from "@/components/ui/music-wave";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactPlayer from "react-player";

interface SongQueueProps {
  songQueue: Song[];
  currentTrackIndex: number;
  submitters: Record<number, User>;
}

export function SongQueue({ songQueue, currentTrackIndex, submitters }: SongQueueProps) {
  const { toast } = useToast();
  const [previewingSongId, setPreviewingSongId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // useEffect(() => {
  //   console.log('Current Song Queue:', songQueue);
  // }, [songQueue]);
  
  const handlePreviewPlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already playing this song, stop it
    if (isPlaying && previewingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (playerRef.current) {
        playerRef.current.getInternalPlayer()?.pauseVideo();
      }
      setIsPlaying(false);
      setPreviewingSongId(null);
      return;
    }
    
    // Play the song
    if (song.sourceType === "spotify") {
      // For Spotify tracks, use standard audio element
      if (audioRef.current) {
        // Spotify preview URLs follow a pattern, but we'd need to fetch it
        // This is a placeholder - in real app, fetch the preview URL
        toast({
          title: "Preview",
          description: "Spotify song preview will be played during the game",
        });
      }
    } else if (song.sourceType === "youtube") {
      // For YouTube, we use ReactPlayer
      setPreviewingSongId(song.id);
      setIsPlaying(true);
      
      // Let user know we're preparing preview
      toast({
        title: "Preview",
        description: "Preparing YouTube preview...",
      });
    }
  };
  return (
    <div className="bg-dark rounded-lg shadow-lg overflow-hidden mb-6">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="font-heading text-lg font-semibold">Song Queue</h2>
      </div>
      
      <div className="p-4 space-y-3">
        {songQueue.map((song, index) => {
          const isPrevious = index < currentTrackIndex;
          const isCurrent = index === currentTrackIndex;
          const isNext = index === currentTrackIndex + 1;
          const isUpcoming = index > currentTrackIndex + 1;
          
          const displayNumber = index + 1;
          const submitter = submitters[song.userId];

          return (
            <div 
              key={song.id}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isCurrent 
                  ? "bg-primary bg-opacity-10 border border-primary/30 relative" 
                  : "bg-surface bg-opacity-50 hover:bg-opacity-70"
              }`}
            >
              {isCurrent && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-primary rounded-r-lg"></div>
              )}
              <div className={`w-8 h-8 flex items-center justify-center ${
                isCurrent ? "bg-primary/20" : "bg-gray-700"
              } rounded-full mr-3`}>
                <span className={`font-semibold ${isCurrent ? "text-primary" : ""}`}>
                  {displayNumber}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {isPrevious ? "Previous track" : 
                   isCurrent ? "Current track" : 
                   isNext ? "Next track" : "Upcoming track"}
                </p>
                <p className="text-xs text-gray-400">{submitter?.username}</p>
              </div>
              <div className="flex items-center space-x-2">
                {isCurrent ? (
                  <MusicWave size="sm" />
                ) : null
                  // (
                  //   <>
                  //     <Button
                  //       variant="ghost"
                  //       size="icon"
                  //       className="h-7 w-7 rounded-full"
                  //       onClick={(e) => handlePreviewPlay(song, e)}
                  //       title="Preview song"
                  //     >
                  //       {isPlaying && previewingSongId === song.id ? (
                  //         <Pause className="h-3 w-3" />
                  //       ) : (
                  //         <Volume2 className="h-3 w-3" />
                  //       )}
                  //     </Button>
                  //     <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                  //       {isPrevious ? "Played" : isNext ? "Next" : "Upcoming"}
                  //     </span>
                  //   </>
                  // )
                }
              </div>
            </div>
          );
        })}
        
        {songQueue.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            No songs in queue. Add songs to get started!
          </div>
        )}
        
        {songQueue.length > 5 && (
          <div className="text-center text-sm text-gray-400 pt-2">
            {songQueue.length - 5} more songs remaining...
          </div>
        )}
      </div>
      
      {/* Hidden audio element for Spotify previews */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Hidden player for YouTube previews */}
      {previewingSongId && isPlaying && songQueue.find(s => s.id === previewingSongId)?.sourceType === "youtube" && (
        <div style={{ display: "none" }}>
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${songQueue.find(s => s.id === previewingSongId)?.sourceId}`}
            playing={isPlaying}
            onReady={() => {
              toast({
                title: "Preview ready",
                description: "Now playing a preview of this song",
              });
            }}
            onEnded={() => {
              setIsPlaying(false);
              setPreviewingSongId(null);
            }}
            onError={() => {
              toast({
                title: "Preview error",
                description: "Could not load preview. Try again later.",
                variant: "destructive",
              });
              setIsPlaying(false);
              setPreviewingSongId(null);
            }}
            width="0%"
            height="0%"
            config={{
              youtube: {
                playerVars: { 
                  start: 30,
                  end: 45,
                  autoplay: 1
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
