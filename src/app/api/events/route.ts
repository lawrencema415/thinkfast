/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for connected clients and messages
const encoder = new TextEncoder();
// Fix: Use the correct controller type
const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const messages: string[] = [];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const message = url.searchParams.get('message');

  // If there's a message parameter, broadcast it to all clients
  if (message) {
    const serverMessage = `Server received: ${message}`;
    messages.push(serverMessage);
    
    // Broadcast to all connected clients
    clients.forEach(controller => {
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message: serverMessage })}\n\n`)
        );
      } catch (e) {
        // If we can't send, the client is probably gone
        console.log('Error sending message to client:', e);
        clients.delete(controller);
      }
    });
    return NextResponse.json({ success: true });
  }

  // Otherwise, set up an SSE connection
  const stream = new ReadableStream({
    start(controller) {
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
      
      // Set up ping interval
      const pingInterval = setInterval(() => {
        // Check if the controller is still in the clients set
        if (!clients.has(controller)) {
          clearInterval(pingInterval);
          return;
        }
        
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ ping: new Date().toISOString() })}\n\n`)
          );
            } catch (e) {
            // If we can't send, the client is probably gone
            console.log('Error sending ping to client:', e);
            clearInterval(pingInterval);
            clients.delete(controller);
            }
        }, 30000);

      // Store the interval ID for cleanup in cancel
      (controller as any).pingIntervalId = pingInterval;
    },
    cancel(controller) {
      // Clear the ping interval if it exists
      if ((controller as any).pingIntervalId) {
        clearInterval((controller as any).pingIntervalId);
      }
      // Remove this client when they disconnect
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
  })};