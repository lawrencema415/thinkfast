import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/hooks/use-game';
import { useRouter } from 'next/navigation';

export default function LeaveRoomButton() {
    const { leaveRoomMutation } = useGame();
    const router = useRouter();
    
    const handleLeaveRoom = () => {
        leaveRoomMutation.mutate();
    };

    return (
        <Button
            variant='secondary'
            className='w-full'
            onClick={handleLeaveRoom}
            disabled={leaveRoomMutation.isPending}
        >
            {leaveRoomMutation.isPending ? 'Leaving...' : 'Leave Room'}
        </Button>
    );
}