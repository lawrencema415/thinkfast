import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Song } from '@shared/schema';
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
    timeRemaining: number;
}

export function GamePlayer({
    currentTrack,
    currentRound,
    totalRounds,
    isPlaying,
    timeRemaining,
}: GamePlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    // const [volume, setVolume] = useState(() => 
    //     getLocalStorage<number>(LOCALSTORAGE_KEYS.VOLUME, 0.5)
    // );
    // const [isMuted, setIsMuted] = useState(false);
	// const [showVolume, setShowVolume] = useState(false);
    const volume = getLocalStorage<number>(LOCALSTORAGE_KEYS.VOLUME, 0.5);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.src = currentTrack?.previewUrl || '';
        audio.load();
        
        if (currentTrack?.previewUrl && audioRef.current) {
            audio.src = currentTrack.previewUrl;
            audio.currentTime = 0;
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

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="text-center">
                    {currentTrack ? 'Now Playing' : 'Ready to Play'}
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
                            <p>Time Remaining: {timeRemaining}s</p>
                        </div>
                    </div>
                )}
                <audio ref={audioRef} />
            </CardContent>
        </Card>
    );
}