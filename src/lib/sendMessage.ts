import { apiRequest } from '@/lib/queryClient';

/**
 * Sends a message to a room
 * @param roomCode The code of the room to send the message to
 * @param content The content of the message
 * @param messageType The type of message (default: 'chat')
 * @returns A promise that resolves when the message is sent
 */
export async function sendMessage({
  roomCode,
  content,
  type = 'chat'
}: {
  roomCode: string;
  content: string;
  type?: 'chat' | 'system' | 'guess';
}) {
  try {
    const res = await apiRequest('POST', '/api/messages', {
      roomCode,
      content,
      type,
    });

    console.log(roomCode, content, type)

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return await res.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}