import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import { Message } from '../types';
import Logo from './Logo';

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
    <button
      type="button"
      onClick={copy}
      className="mt-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const ChatMessage = ({ message }: { message: Message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] flex-col items-end gap-2">
          {message.image && (
            <img src={message.image} alt="Attached" className="max-h-64 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          )}
          {message.content && (
            <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-[15px] leading-relaxed text-white">
              {message.content}
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
        <div className="prose prose-zinc max-w-none break-words text-[15px] leading-relaxed dark:prose-invert prose-p:my-2 prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-code:before:content-none prose-code:after:content-none">
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </div>
        <CopyButton text={message.content} />
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
          className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
);

export default ChatMessage;
