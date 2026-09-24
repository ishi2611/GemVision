import { Message, Mode } from '../types';

export class ChatError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
  }
}

interface ChatRequest {
  message: string;
  image?: string;
  history: Message[];
  mode: Mode;
}

export async function sendChat({ message, image, history, mode }: ChatRequest): Promise<string> {
  // Only the most recent image is sent again, so follow-up questions can refer to it
  // without making every request huge.
  const lastImageId = image ? undefined : [...history].reverse().find((m) => m.image)?.id;

  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mode,
        image_data: image ?? null,
        history: history.map(({ id, role, content, image: img }) => ({
          role,
          content,
          ...(id === lastImageId && img ? { image: img } : {}),
        })),
      }),
    });
  } catch {
    throw new ChatError("Couldn't reach GemVision. Check your internet connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 413) {
      throw new ChatError('That image is too large. Please try a smaller one.');
    }
    throw new ChatError(data.error || `Something went wrong (error ${res.status}). Please try again.`, data.retry_after);
  }
  return data.response;
}
