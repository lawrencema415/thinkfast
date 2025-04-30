/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Room } from '@/shared/schema';

// Define event types for type safety
type GameEvent = {
    type: 'playerJoined' | 'playerLeft' | 'gameStarted' | 'roundUpdate' | 'correctGuess' | 'gameEnded' | 'roomUpdate';
    data: any;
};

// In-memory storage for rooms and clients
const encoder = new TextEncoder();
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const rooms = new Map<string, Room>();

// Helper function to broadcast events to all clients
function broadcastEvent(event: GameEvent) {
    const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    clients.forEach(controller => {
        try {
            controller.enqueue(encoder.encode(eventString));
        } catch (e) {
            console.error('Failed to send event to client:', e);
            clients.delete(controller);
        }
    });
}

// Helper function to create a new room
function createRoom(hostId: number, songsPerPlayer: number, timePerSong: number): Room {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: Room = {
        id: rooms.size + 1, // Simple incremental ID
        code: roomCode,
        hostId,
        songsPerPlayer,
        timePerSong,
        isActive: true,
        isPlaying: false,
        createdAt: new Date()
    };
    
    rooms.set(roomCode, room);
    return room;
}

// Helper function to get a room
function getRoom(code: string): Room | undefined {
    return rooms.get(code);
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    
    // Handle event broadcasting through query parameters
    const eventType = url.searchParams.get('eventType');
    const eventData = url.searchParams.get('eventData');
    
    if (eventType && eventData) {
        try {
            const data = JSON.parse(eventData);
            
            // If this is a room creation event, create the room
            if (eventType === 'roomUpdate' && data.room) {
                const room = createRoom(
                    data.room.hostId,
                    data.room.songsPerPlayer,
                    data.room.timePerSong
                );
                data.room = room;
            }
            
            broadcastEvent({ type: eventType as GameEvent['type'], data });
            return NextResponse.json({ success: true });
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid event data' }, { status: 400 });
        }
    }

    // Set up SSE connection
    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection confirmation
            controller.enqueue(
                encoder.encode(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
            );
            
            // Add this client to our set
            clients.add(controller);
            
            // Set up ping interval
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(
                        encoder.encode(`event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`)
                    );
                } catch (e) {
                    clearInterval(pingInterval);
                    clients.delete(controller);
                }
            }, 30000);

            // Store the interval ID for cleanup
            (controller as any).pingIntervalId = pingInterval;
        },
        cancel(controller) {
            if ((controller as any).pingIntervalId) {
                clearInterval((controller as any).pingIntervalId);
            }
            clients.delete(controller);
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
