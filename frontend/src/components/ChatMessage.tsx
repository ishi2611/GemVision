import { ReactNode, useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardIcon,
  PencilSquareIcon,
  SpeakerWaveIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { canSpeak, speak, stopSpeaking } from '../lib/speech';
import { Message } from '../types';
import Logo from './Logo';

const ActionButton = ({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
  >
    {children}
  </button>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (e.g. non-HTTPS); nothing useful to do.
    }
  };

  return (
    <ActionButton onClick={copy} label="Copy">
      {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </ActionButton>
  );
};

const SpeakButton = ({ text }: { text: string }) => {
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  // Stop reading if the message disappears (e.g. switching chats).
  useEffect(
    () => () => {
      if (speakingRef.current) stopSpeaking();
    },
    [],
  );

  if (!canSpeak()) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speak(text, () => setSpeaking(false));
    }
  };

  return (
    <ActionButton onClick={toggle} label={speaking ? 'Stop reading' : 'Read aloud'}>
      {speaking ? <StopIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
      <span>{speaking ? 'Stop' : 'Listen'}</span>
    </ActionButton>
  );
};

interface ChatMessageProps {
  message: Message;
  /** Only the latest messages can be edited or regenerated. */
  onEdit?: () => void;
  onRegenerate?: () => void;
}

const ChatMessage = ({ message, onEdit, onRegenerate }: ChatMessageProps) => {
  if (message.role === 'user') {
    return (
      <div className="group flex justify-end">
        <div className="flex max-w-[85%] flex-col items-end gap-2">
          {message.image && (
            <img
              src={message.image}
              alt="Attached"
              className="max-h-64 rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700"
            />
          )}
          {message.content && (
            <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
              {message.content}
            </div>
          )}
          {onEdit && (
            <div className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
              <ActionButton onClick={onEdit} label="Edit message">
                <PencilSquareIcon className="h-4 w-4" />
                <span>Edit</span>
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Logo className="mt-0.5 h-7 w-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="prose prose-slate max-w-none break-words text-[15px] leading-relaxed dark:prose-invert prose-p:my-2 prose-pre:rounded-xl prose-pre:bg-slate-900 prose-code:before:content-none prose-code:after:content-none prose-table:text-sm">
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-0.5">
          <CopyButton text={message.content} />
          <SpeakButton text={message.content} />
          {onRegenerate && (
            <ActionButton onClick={onRegenerate} label="Regenerate response">
              <ArrowPathIcon className="h-4 w-4" />
              <span>Regenerate</span>
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator = () => (
  <div className="flex gap-3" aria-label="GemVision is typing">
    <Logo className="h-7 w-7 shrink-0" />
    <div className="flex items-center gap-1 pt-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
);

export default ChatMessage;
