import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

interface DummyButtonProps {
  roomCode: string;
}

export function DummyButton({ roomCode }: DummyButtonProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
        if (!roomCode) {
        toast({
            title: 'Error',
            description: 'Room code is required',
            variant: 'destructive',
        });
        return;
        }

        setIsLoading(true);
        try {
        const response = await fetch('/api/game/song', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomCode }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get song');
        }

        toast({
            title: 'Success',
            description: 'Song selected successfully',
        });
        } catch (error) {
        console.error('Error selecting song:', error);
        toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to select song',
            variant: 'destructive',
        });
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div>
            <Button 
            onClick={handleClick} 
            disabled={isLoading}
            variant="default"
            >
            {isLoading ? 'Loading...' : 'Test Next Song'}
            </Button>
        </div>
    );
}