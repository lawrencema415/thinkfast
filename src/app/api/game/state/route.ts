import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../storage'; // Assuming storage is a module to interact with your data

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode');
    // const roomId = searchParams.get('roomId');
    // console.log('called', roomId);
    console.log('called', roomCode);

    // if (!roomId) {
    //     return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    // }

    if (!roomCode) {
        return NextResponse.json({ error: 'Room Code is required' }, { status: 400 });
    }

    // const room = await storage.getRoom(roomId);
    const room = await storage.getRoomByCode(roomCode);
    console.log(room, 'room');
    if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const roomId = room.id;

    const players = await storage.getPlayersInRoom(roomId);
    const songs = await storage.getSongsForRoom(roomId);
    const messages = await storage.getMessagesForRoom(roomId);

    const gameState = {
        room,
        players,
        songs,
        messages,
        currentTrack: room.isPlaying ? songs.find(s => !s.isPlayed) : null,
        currentRound: songs.filter(s => s.isPlayed).length,
        totalRounds: songs.length,
        isPlaying: room.isPlaying,
        timeRemaining: room.timePerSong
    };
    console.log('gameState', gameState);
    
    return NextResponse.json({ gameState });
}
