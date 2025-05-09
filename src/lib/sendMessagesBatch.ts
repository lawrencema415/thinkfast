// sendMessage.ts
import { apiRequest } from '@/lib/queryClient';

export async function sendMessagesBatch({
  roomCode,
  messages,
  type = 'chat',
}: {
  roomCode: string;
  messages: { id: string; content: string }[];
  type?: 'chat' | 'system' | 'guess';
}) {
  try {
    const res = await apiRequest('POST', '/api/messages/batch', {
      roomCode,
      messages,
      type,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send messages');
    }

    return await res.json();
  } catch (error) {
    console.error('Error sending messages:', error);
    throw error;
  }
}
