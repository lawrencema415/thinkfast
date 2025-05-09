import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Song } from '@shared/schema';
import { Music2 } from 'lucide-react';
import { Hint } from './Hint';
import {
	getLocalStorage,
	LOCALSTORAGE_KEYS,
	setLocalStorage,
} from '@/lib/localStorage';

interface GamePlayerProps {
    currentTrack: Song | null;
    currentRound: number;
    totalRounds: number;
    isPlaying: boolean;
    currentTrackStartedAt: Date | null;
    timePerSong: number;
}

export function GamePlayer({
    currentTrack,
    currentRound,
    totalRounds,
    isPlaying,
    currentTrackStartedAt,
    timePerSong,
}: GamePlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const volume = getLocalStorage(LOCALSTORAGE_KEYS.VOLUME, 0.5);
    // const [currentTime, setCurrentTime] = useState(new Date().getTime());
    const [trackRunTime, setTrackRunTime] = useState(new Date().getTime());
    const joinTimeRef = useRef(new Date().getTime()); // When user joins room
    const startedAtTime = currentTrackStartedAt instanceof Date 
        ? currentTrackStartedAt.getTime() 
        : currentTrackStartedAt ? new Date(currentTrackStartedAt).getTime() : joinTimeRef.current;

    // sync up client audio that join in the middle of round
    const trackStartTime = useRef(joinTimeRef.current - startedAtTime)

    useEffect(()=> {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            setTrackRunTime(now - startedAtTime);
            // setCurrentTime(new Date().getTime());
        }, 10);
        return () => clearInterval(interval);
    }, [startedAtTime]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.src = currentTrack?.previewUrl || '';
        audio.load();
        
        const handleLoadedMetadata = () => {
            if (currentTrack?.previewUrl) {
                // song will play the last timePerSong seconds
                // backend route can add intermission delay to game round
                audio.currentTime = Math.max(0, audio.duration - timePerSong + trackStartTime.current / 1000);
                audio.play();
            }
        };
    
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        // commented function starts song at duration 0:00
        // if (currentTrack?.previewUrl && audioRef.current) {
        //     audio.src = currentTrack.previewUrl;
        //     audio.currentTime = trackStartTime.current / 1000;
        //     audio.play();
        // }

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [currentTrack?.previewUrl, isPlaying, timePerSong]);
    
    useEffect(() => {
        const audio = audioRef.current;
		if (audio) {
            audio.volume = volume;
		}
		setLocalStorage(LOCALSTORAGE_KEYS.VOLUME, volume);
	}, [volume, audioRef]);
    
    
    if (!currentTrack) {
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
                            Song {currentRound} of {totalRounds} playing
                        </h2>
                        <p className='text-gray-400'>Guess the song</p>
                    </div>
                </CardTitle>
            </CardHeader>
            
            <CardContent>
                {currentTrack && (
                    <Hint
                    currentTrack={currentTrack}
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    timePerSong={timePerSong}
                    trackRunTime={trackRunTime}
                    />
                )}
                <audio ref={audioRef} />
            </CardContent>
        </Card>
    );
}