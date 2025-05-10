import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Round } from '@shared/schema';
import { Music2 } from 'lucide-react';
import { Hint } from './Hint';
import {
	getLocalStorage,
	LOCALSTORAGE_KEYS,
	setLocalStorage,
} from '@/lib/localStorage';

interface GamePlayerProps {
    totalRounds: number;
    isPlaying: boolean;
    timePerSong: number;
    round: Round | null;
}

export function GamePlayer({
    totalRounds,
    isPlaying,
    timePerSong,
    round,
}: GamePlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const volume = getLocalStorage(LOCALSTORAGE_KEYS.VOLUME, 0.5);
    const joinTimeRef = useRef(new Date().getTime());

    const {
        roundNumber,
        song,
        startedAt,
        hash,
    } = round ?? {}
    
    // Use state instead of ref for startedAtTime
    const [startedAtTime, setStartedAtTime] = useState(() => 
        startedAt instanceof Date 
            ? startedAt.getTime() 
            : startedAt ? new Date(startedAt).getTime() : null
    );
    
    // Update startedAtTime when currentTrackStartedAt changes
    useEffect(() => {
        const newStartedAtTime = startedAt instanceof Date 
            ? startedAt.getTime() 
            : startedAt ? new Date(startedAt).getTime() : null;
        
        setStartedAtTime(newStartedAtTime);
    }, [startedAt, song]);
    
    const [trackRunTime, setTrackRunTime] = useState(0);
    
    // Calculate track start offset when startedAtTime changes
    const [trackStartTime, setTrackStartTime] = useState(0);
    
    useEffect(() => {
        if (startedAtTime){
            setTrackStartTime(Math.max(0, joinTimeRef.current - startedAtTime));
        }
    }, [startedAtTime, song]);

    useEffect(() => {
        const interval = setInterval(() => {
            if(startedAtTime){
                const now = new Date().getTime();
                setTrackRunTime(Math.max(0, now - startedAtTime));
            }
        }, 10);
        return () => clearInterval(interval);
    }, [startedAtTime, song]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.src = song?.previewUrl || '';
        audio.load();
        
        const handleLoadedMetadata = () => {
            if (song?.previewUrl) {
                // song will play the last timePerSong seconds
                // backend route can add intermission delay to game round
                audio.currentTime = Math.max(0, audio.duration - timePerSong + trackStartTime / 1000);
                audio.play();
            }
        };
    
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [song?.previewUrl, isPlaying, timePerSong, trackStartTime]);
    
    useEffect(() => {
        const audio = audioRef.current;
		if (audio) {
            audio.volume = volume;
		}
		setLocalStorage(LOCALSTORAGE_KEYS.VOLUME, volume);
	}, [volume, audioRef]);
    
    
    if (!song) {
        return (
            <div className='bg-gray-800 rounded-lg p-6 text-center mb-5'>
				<Music2 className='h-12 w-12 mx-auto mb-4 text-gray-400' />
				<p className='text-gray-300'>Waiting for game to start...</p>
			</div>
		);
	}

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-center">
                    <div className='text-center mb-6'>
                        <h2 className='text-xl font-heading font-bold mb-2'>
                            Song {roundNumber} of {totalRounds} playing
                        </h2>
                        <p className='text-gray-400'>Guess the song</p>
                    </div>
                </CardTitle>
            </CardHeader>
            
            <CardContent>
                {song && hash && (
                    <Hint
                    hash={hash}
                    song={song}
                    timePerSong={timePerSong}
                    trackRunTime={trackRunTime}
                    />
                )}
                <audio ref={audioRef} />
            </CardContent>
        </Card>
    );
}