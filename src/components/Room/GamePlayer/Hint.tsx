import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Song } from '@shared/schema';

interface HintProps {
    song: Song | null;
    timePerSong: number;
    trackRunTime: number;
    hash: string;
}

const INITIAL_BLUR = 100;
const MIN_BLUR = 0;
const INITIAL_CONTRAST = 0.4;
const MAX_CONTRAST = 1;
const INITIAL_BRIGHTNESS = 0.4;
const MAX_BRIGHTNESS = 1;

function encodeArtist(artist: string): string {
    let hint = '';
    let properNameStart = true;
    for (let i = 0; i < artist.length; i++) {
        if (properNameStart){
            hint += artist[i]
            properNameStart = false;
        };

        if (artist[i] === ' '){
            properNameStart = true;
        };
    };

    return hint;
}

export function Hint({
    song,
    timePerSong,
    trackRunTime,
    hash,
}: HintProps) {
    const [showTitle, setShowTitle] = useState('???');
    const [showArtist, setShowArtist] = useState('???');
    // const [artistHint, setArtistHint] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [blur, setBlur] = useState(INITIAL_BLUR)
    const [contrast, setContrast] = useState(INITIAL_CONTRAST)
    const [brightness, setBrightness] = useState(INITIAL_BRIGHTNESS)

    // on roundNumber change, reset hint
    // useEffect(() => {
    //     if (song) {
    //         setShowTitle('???');
    //         setShowArtist('???');
    //     }
    // }, [song, progressPercent]);

    useEffect(() => {
        const progress = (Math.max(0, (trackRunTime / (timePerSong*1000)) * 100));
        setProgressPercent(progress);
        
        const newBlur = Math.max(MIN_BLUR, INITIAL_BLUR - progressPercent);
        setBlur(newBlur);
        
        const newContrast = INITIAL_CONTRAST + (progressPercent / 100) * (MAX_CONTRAST - INITIAL_CONTRAST);
        setContrast(newContrast);
        
        const newBrightness = INITIAL_BRIGHTNESS + (progressPercent / 100) * (MAX_BRIGHTNESS - INITIAL_BRIGHTNESS);
        setBrightness(newBrightness);

        if (progress < 5) {
            setShowTitle('???');
            setShowArtist('???');
        }

        if (progress > 30 && progress < 100) {
            setShowTitle(hash);
            setShowArtist(encodeArtist(song?.artist || ''))
        }

        if (progress > 100) {
            setShowTitle(song?.title || '???');
            setShowArtist(song?.artist || '???');
        } 
    }, [trackRunTime, timePerSong, progressPercent, song, hash]);


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
                        {showTitle}
                    </h3>
                    <p className="text-gray-500">
                        {showArtist}
                    </p>
                </div>
                
                <div>
                    <p>Track Time: { trackRunTime }s</p>
                </div>
            </div>
        </div>
        
    )
}