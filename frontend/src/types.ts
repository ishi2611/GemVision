export interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatMessageProps {
  message: Message;
}

export interface InputAreaProps {
  onSendMessage: (message: string, imageData?: string) => void;
  onFileUpload: (file: File) => Promise<string | null>;
  loading: boolean;
}

export interface HeaderProps {
  onExport: () => void;
}
