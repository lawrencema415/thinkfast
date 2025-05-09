import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Song } from '@shared/schema';
import { Music2 } from 'lucide-react';
import Image from 'next/image';
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
}

export function GamePlayer({
    currentTrack,
    currentRound,
    totalRounds,
    isPlaying,
    currentTrackStartedAt,
}: GamePlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const volume = getLocalStorage(LOCALSTORAGE_KEYS.VOLUME, 0.5);
    const [currentTime, setCurrentTime] = useState(new Date().getTime());
    const joinTimeRef = useRef(new Date().getTime());
    const startedAtTime = currentTrackStartedAt instanceof Date 
        ? currentTrackStartedAt.getTime() 
        : currentTrackStartedAt ? new Date(currentTrackStartedAt).getTime() : joinTimeRef.current;
    const trackStartTime = useRef(joinTimeRef.current - startedAtTime)

    useEffect(()=> {
        const interval = setInterval(() => {
            setCurrentTime(new Date().getTime());
        }, 10);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.src = currentTrack?.previewUrl || '';
        audio.load();
        
        if (currentTrack?.previewUrl && audioRef.current) {
            audio.src = currentTrack.previewUrl;
            audio.currentTime = trackStartTime.current / 1000;
            audio.play();
        }
    }, [currentTrack?.previewUrl, isPlaying]);
    
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
                    <div className="flex flex-col items-center gap-4">
                        {currentTrack.albumArt && (
                            <div className="w-48 h-48 relative">
                                <Image 
                                    src={currentTrack.albumArt} 
                                    alt="Album art"
                                    className="w-full h-full object-cover rounded-md"
                                    height={32}
							        width={32}
                                />
                            </div>
                        )}
                        
                        <div className="text-center">
                            <h3 className="text-xl font-bold">{currentTrack.title}</h3>
                            <p className="text-gray-500">{currentTrack.artist}</p>
                        </div>
                        
                        <div>
                            <p>Round: {currentRound} / {totalRounds}</p>
                            <p>Track Time: {startedAtTime ? currentTime - startedAtTime : '0'}s</p>
                        </div>
                    </div>
                )}
                <audio ref={audioRef} />
            </CardContent>
        </Card>
    );
}