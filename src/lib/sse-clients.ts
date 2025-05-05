const encoder = new TextEncoder();

// Create a global variable that won't be reset on module reloads
const globalForClients = global as unknown as {
  clients: Map<string, ReadableStreamDefaultController<Uint8Array>> | undefined;
};

// Initialize the clients map if it doesn't exist
if (!globalForClients.clients) {
  globalForClients.clients = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
}

export const clients = globalForClients.clients;
export const sseEncoder = encoder;
