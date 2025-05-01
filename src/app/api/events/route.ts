/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const encoder = new TextEncoder();
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const messages: string[] = [];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const message = url.searchParams.get('message');

  if (message) {
    const serverMessage = `Server received: ${message}`;
    messages.push(serverMessage);
    
    // Create an array to store promises for each client
    const broadcastPromises: Promise<void>[] = [];
    const clientsToRemove = new Set<ReadableStreamDefaultController<Uint8Array>>();

    // Broadcast to all connected clients
    clients.forEach(controller => {
      const promise = new Promise<void>((resolve) => {
        try {
          // Check if controller is still valid
          if (!controller.desiredSize || controller.desiredSize === null) {
            clientsToRemove.add(controller);
            resolve();
            return;
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: serverMessage })}\n\n`)
          );
          resolve();
        } catch (e) {
          console.log('Error sending message to client:', e);
          clientsToRemove.add(controller);
          resolve();
        }
      });
      broadcastPromises.push(promise);
    });

    // Wait for all broadcasts to complete
    await Promise.all(broadcastPromises);
    
    // Clean up disconnected clients
    clientsToRemove.forEach(controller => {
      clients.delete(controller);
    });

    return NextResponse.json({ 
      success: true,
      activeClients: clients.size 
    });
  }

  // Otherwise, set up an SSE connection
  const stream = new ReadableStream({
    start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: 'Connected to SSE' })}\n\n`)
        );
        
        // Send all existing messages
        messages.forEach(msg => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`)
          );
        });
        
        // Add this client to our set
        clients.add(controller);
        
        // Set up ping interval with error handlin

        // Store the interval ID for cleanup
      } catch (error) {
        console.error('Error in stream start:', error);
        clients.delete(controller);
      }
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
