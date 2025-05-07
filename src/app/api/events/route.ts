/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthInRouteHandler } from '@/lib/auth';
import { clients, sseEncoder as encoder } from '@/lib/sse-clients';
import { storage } from '../storage';
import { broadcastGameState } from '@/lib/broadcast';

// Use the global clients map
const messages: string[] = [];
// Add a map to track disconnection timers
// Make sure the disconnectionTimers map is properly scoped
// Move it outside the function to ensure it's shared across requests
const disconnectionTimers = new Map<string, NodeJS.Timeout>();

export async function GET(request: NextRequest) {
  const { user } = await verifyAuthInRouteHandler();
  const url = new URL(request.url);
  const message = url.searchParams.get('message');
  const userId = user?.id;
  
  // console.log(`GET /api/events - User ID: ${userId}, Client count before: ${clients.size}, Clients: ${Array.from(clients.keys())}`);
  // const userId = url.searchParams.get('userId'); 

  let parsedMessage: any = null;

  if (message) {
    try {
      parsedMessage = JSON.parse(message);
      console.log('Parsed message:', parsedMessage);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  if (message && userId) {
    const serverMessage = `Server received: ${message}`;
    messages.push(serverMessage);

    // Only broadcast to the specific user
    const controller = clients.get(userId);
    if (controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: serverMessage })}\n\n`)
        );
      } catch (e) {
        console.log('Error sending message to client:', e);
        clients.delete(userId);
      }
    }

    return NextResponse.json({
      success: true,
      activeClients: clients.size
    });
  }

  // Otherwise, set up an SSE connection for this user
  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`)
        );

        messages.forEach(msg => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`)
          );
        });

        // Add this client to our map
        clients.set(userId, controller);
        
        // Add more logging to debug the issue
        console.log(`Client connected - User ID: ${userId}, Has timer: ${disconnectionTimers.has(userId)}`);
        
        // Clear any pending disconnection timer for this user
        if (disconnectionTimers.has(userId)) {
          clearTimeout(disconnectionTimers.get(userId));
          disconnectionTimers.delete(userId);
          console.log(`User ${userId} reconnected within grace period, cleared disconnection timer`);
        }
        
        // console.log(`Client added - User ID: ${userId}, Total clients: ${clients.size}, All clients: ${Array.from(clients.keys())}`);

        // const pingIntervalId = setInterval(() => {
        //   try {
        //     controller.enqueue(encoder.encode(':\n\n'));
        //   } catch (e) {
        //     console.log(`Ping failed for user ${userId}, removing client`, e);
        //     clearInterval(pingIntervalId);
        //     clients.delete(userId);
        //   }
        // }, 15000);

        // (controller as any).pingIntervalId = pingIntervalId;
      } catch (error) {
        console.error('Error in stream start:', error);
        clients.delete(userId);
      }
    },
    cancel(controller) {
      // console.log(`Stream cancelled for user ${userId}, removing client`);
      if ((controller as any).pingIntervalId) {
        clearInterval((controller as any).pingIntervalId);
      }
      clients.delete(userId);
      
      const roomCode = url.searchParams.get('roomCode');
      
      if (roomCode && userId) {
        // Add more logging to debug the issue
        console.log(`Client disconnected - User ID: ${userId}, Has existing timer: ${disconnectionTimers.has(userId)}`);
        
        // Clear any existing timer for this user
        if (disconnectionTimers.has(userId)) {
          clearTimeout(disconnectionTimers.get(userId));
          disconnectionTimers.delete(userId);
          console.log(`Cleared existing timer for user ${userId} before setting a new one`);
        }
        
        // Set a new timer to remove the player after a delay
        const timer = setTimeout(async () => {
          try {
            // Double-check if the user has reconnected before proceeding
            if (clients.has(userId)) {
              console.log(`Timer fired but user ${userId} has reconnected, not removing from room ${roomCode}`);
              disconnectionTimers.delete(userId);
              return;
            }
            const roomId = await storage.getRoomByCode(roomCode);

            if (roomId) {
              // Check if the user has reconnected
              if (clients.has(userId)) {
                console.log(`User ${userId} reconnected, not removing from room ${roomCode}`);
                return;
              }
              
              // Remove the player from the room
              await storage.removePlayerFromRoom(roomCode, user);
              
              // Broadcast the updated game state to all remaining players
              await broadcastGameState(roomCode, storage);
              console.log(`Player ${userId} removed from room ${roomCode} after disconnection timeout`);
            }
            
            // Clean up the timer reference
            disconnectionTimers.delete(userId);
          } catch (error) {
            console.error(`Error handling disconnection for user ${userId} in room ${roomCode}:`, error);
            disconnectionTimers.delete(userId);
          }
        }, 3000); // 3 second grace period
        
        disconnectionTimers.set(userId, timer);
        console.log(`Set disconnection timer for user ${userId} in room ${roomCode}`);
      }
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
