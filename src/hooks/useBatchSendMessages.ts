import { useRef, useCallback, useEffect } from 'react';
import { sendMessagesBatch } from '@/lib/sendMessagesBatch';

type MessageType = 'chat' | 'system' | 'guess';

interface OutgoingMessage {
  id: string;
  content: string;
}

export function useBatchSendMessages(
  roomCode: string,
  type: MessageType = 'chat'
) {
  const queueRef = useRef<OutgoingMessage[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const messagesToSend = [...queueRef.current];
    queueRef.current = [];
    await sendMessagesBatch({ roomCode, messages: messagesToSend, type });
  }, [roomCode, type]);

  const addMessage = useCallback((msg: OutgoingMessage) => {
    queueRef.current.push(msg);
    if (!timerRef.current) {
      timerRef.current = setTimeout(async () => {
        await flush();
        timerRef.current = null;
      }, 500);
    }
  }, [flush]);

  useEffect(() => {
    return () => {
      if (queueRef.current.length > 0) {
        flush();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flush]);

  return addMessage;
}
