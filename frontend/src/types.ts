export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Data URL of an attached image (user messages only). */
  image?: string;
}

export interface ChatErrorState {
  message: string;
  /** Epoch ms after which retrying makes sense (set for rate-limit errors). */
  retryAt?: number;
}
