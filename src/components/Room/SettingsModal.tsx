import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  roomCode: string;
  currentSongsPerPlayer: number;
  currentTimePerSong: number;
  isHost: boolean;
}

export function SettingsModal({
  roomCode,
  currentSongsPerPlayer,
  currentTimePerSong,
  isHost,
}: SettingsModalProps) {
  // Ensure initial values are within the new limits
  const initialSongsPerPlayer = Math.min(Math.max(currentSongsPerPlayer, 1), 5);
  const initialTimePerSong = Math.min(Math.max(currentTimePerSong, 5), 15);
  
  const [songsPerPlayer, setSongsPerPlayer] = useState(initialSongsPerPlayer);
  const [timePerSong, setTimePerSong] = useState(initialTimePerSong);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Handler for songs per player input to enforce limits
  const handleSongsPerPlayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Enforce min/max limits
    if (value < 1) setSongsPerPlayer(1);
    else if (value > 5) setSongsPerPlayer(5);
    else setSongsPerPlayer(value);
  };

  // Handler for time per song input to enforce limits
  const handleTimePerSongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Enforce min/max limits
    if (value < 5) setTimePerSong(5);
    else if (value > 15) setTimePerSong(15);
    else setTimePerSong(value);
  };

  const handleSubmit = async () => {
    if (!isHost) {
      toast({
        title: 'Permission Denied',
        description: 'Only the host can change game settings.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/rooms/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          songsPerPlayer,
          timePerSong,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      toast({
        title: 'Settings Updated',
        description: 'Game settings have been updated successfully.',
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isHost}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Adjust the game settings for this room. Only the host can change these settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="songsPerPlayer" className="text-right">
              Songs Per Player (1-5)
            </Label>
            <Input
              id="songsPerPlayer"
              type="number"
              min={1}
              max={5}
              value={songsPerPlayer}
              onChange={handleSongsPerPlayerChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timePerSong" className="text-right">
              Time Per Song (5-15 sec)
            </Label>
            <Input
              id="timePerSong"
              type="number"
              min={5}
              max={15}
              value={timePerSong}
              onChange={handleTimePerSongChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isHost}
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}