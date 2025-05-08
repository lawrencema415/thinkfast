import { Song } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useState } from 'react';

interface AddedSongsProps {
  songQueue: Song[];
  roomCode: string;
  userId: string;
}

export function AddedSongs({ songQueue, roomCode, userId }: AddedSongsProps) {
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Filter songs to only show those added by the current user
  const userSongs = songQueue.filter(song => song.userId === userId);

  const handleRemoveSong = async (songId: string) => {
    try {
      setIsRemoving(songId);
      await axios.post('/api/songs/remove', {
        roomCode,
        songId
      });
      toast({
        title: 'Song removed',
        description: 'The song has been removed from the queue',
      });
    } catch (error) {
      console.error('Failed to remove song:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove song from the queue',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className='bg-dark rounded-lg shadow-lg overflow-hidden mb-6'>
      <div className='p-4 bg-gray-800 border-b border-gray-700'>
        <h2 className='font-heading text-lg font-semibold'>Your Added Songs</h2>
      </div>

      <div className='p-4 space-y-3'>
        {userSongs.map((song, index) => (
          <div
            key={song.id}
            className='flex items-center p-3 rounded-lg transition-colors bg-surface bg-opacity-50 hover:bg-opacity-70'
          >
            <div className='w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3'>
              <span className='font-semibold'>{index + 1}</span>
            </div>
            
            <div className='flex-1 flex items-center'>
              {song.albumArt && (
                <Image
                  src={song.albumArt}
                  alt={song.title}
                  className='w-10 h-10 rounded mr-3'
                  height={40}
                  width={40}
                />
              )}
              <div className='flex-1'>
                <h3 className='font-medium text-sm'>{song.title}</h3>
                <p className='text-xs text-gray-400'>{song.artist}</p>
              </div>
              
              <div className='flex items-center'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-gray-400 hover:text-error'
                  onClick={() => handleRemoveSong(song.id)}
                  disabled={isRemoving === song.id}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {userSongs.length === 0 && (
          <div className='text-center py-4 text-gray-400'>
            You have not added any songs yet.
          </div>
        )}
      </div>
    </div>
  );
}