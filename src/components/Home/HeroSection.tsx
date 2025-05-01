'use client';

import { Button } from '@/components/ui/button';
import { MusicWave } from '@/components/ui/music-wave';
import { ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onStartPlaying: () => void;
}

export function HeroSection({ onStartPlaying }: HeroSectionProps) {
  return (
    <section className='bg-gradient-to-br from-primary/20 via-dark to-secondary/20 py-16 md:py-24'>
      <div className='container mx-auto px-4 text-center'>
        <h1 className='text-4xl md:text-6xl font-heading font-bold mb-6'>
          <span className='text-primary'>Think</span>
          <span className='text-white'>Fast</span>
        </h1>
        <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto'>
          The ultimate multiplayer music guessing game. Who among you knows
          the latest music best?
        </p>
        <div className='flex justify-center mb-10'>
          <MusicWave className='h-16' />
        </div>
        <Button
          size='lg'
          className='text-lg px-8'
          onClick={onStartPlaying}
        >
          Start Playing <ChevronRight className='ml-2 h-5 w-5' />
        </Button>
      </div>
    </section>
  );
}