import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Song } from '@shared/schema';

interface HintProps {
    song: Song | null;
    timePerSong: number;
    trackRunTime: number;
}

const INITIAL_BLUR = 100;
const MIN_BLUR = 0;
const INITIAL_CONTRAST = 0.4;
const MAX_CONTRAST = 1;
const INITIAL_BRIGHTNESS = 0.4;
const MAX_BRIGHTNESS = 1;

export function Hint({
    song,
    timePerSong,
    trackRunTime,
}: HintProps) {
    const [showSongName, setShowSongName] = useState('???');
    const [showArtistName, setShowArtistName] = useState('???');
    const [progressPercent, setProgressPercent] = useState(0);
    const [blur, setBlur] = useState(INITIAL_BLUR)
    const [contrast, setContrast] = useState(INITIAL_CONTRAST)
    const [brightness, setBrightness] = useState(INITIAL_BRIGHTNESS)

    useEffect(() => {
        const progress = (Math.max(0, (trackRunTime / (timePerSong*1000)) * 100));
        setProgressPercent(progress);
        
        const newBlur = Math.max(MIN_BLUR, INITIAL_BLUR - progressPercent);
        setBlur(newBlur);
        
        const newContrast = INITIAL_CONTRAST + (progressPercent / 100) * (MAX_CONTRAST - INITIAL_CONTRAST);
        setContrast(newContrast);
        
        const newBrightness = INITIAL_BRIGHTNESS + (progressPercent / 100) * (MAX_BRIGHTNESS - INITIAL_BRIGHTNESS);
        setBrightness(newBrightness);

        if (progress > 100) {
            setShowSongName(song?.title || '???');
            setShowArtistName(song?.artist || '???');
        } 
    }, [trackRunTime, timePerSong, progressPercent, song]);


    // on currentTrack change, reset hint
    useEffect(() => {
        if (song) {
            setShowSongName('???');
            setShowArtistName('???');
        }
    }, [song]);

    return (
        <div>
            <div className="flex flex-col items-center gap-4">
                {song?.albumArt && (
                    <div className="w-48 h-48 relative">
                        <Image 
                            src={song?.albumArt} 
                            alt="Album art"
                            className="w-full h-full object-cover rounded-md"
                            height={144}
                            width={144}
                            style={{
                                filter: `blur(${blur}px) contrast(${contrast}) brightness(${brightness})`,
                            }}
                        />
                    </div>
                )}
                
                <div className="text-center">
                <h3 className="text-xl font-bold">
                        {showSongName}
                    </h3>
                    <p className="text-gray-500">
                        {showArtistName}
                    </p>
                </div>
                
                <div>
                    <p>Track Time: { trackRunTime }s</p>
                </div>
            </div>
        </div>
        
    )
}