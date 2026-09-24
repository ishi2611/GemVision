import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import EmptyState from './components/EmptyState';
import ChatMessage, { TypingIndicator } from './components/ChatMessage';
import ErrorNotice from './components/ErrorNotice';
import Composer from './components/Composer';
import { ChatError, sendChat } from './lib/api';
import { ChatErrorState, Message } from './types';

const newId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ChatErrorState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Bumped on "New chat" so a reply to the old conversation is ignored.
  const conversationRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, error]);

  // Ask the model to reply to the last (user) message in `conversation`.
  const requestReply = async (conversation: Message[]) => {
    const conversationId = conversationRef.current;
    const last = conversation[conversation.length - 1];
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChat({
        message: last.content,
        image: last.image,
        history: conversation.slice(0, -1),
      });
      if (conversationId !== conversationRef.current) return;
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: reply }]);
    } catch (e) {
      if (conversationId !== conversationRef.current) return;
      const err = e instanceof ChatError ? e : new ChatError('Something went wrong. Please try again.');
      setError({
        message: err.message,
        retryAt: err.retryAfter ? Date.now() + err.retryAfter * 1000 : undefined,
      });
    } finally {
      if (conversationId === conversationRef.current) setLoading(false);
    }
  };

  const send = (text: string, image?: string) => {
    if (loading) return;
    const next = [...messages, { id: newId(), role: 'user' as const, content: text, image }];
    setMessages(next);
    requestReply(next);
  };

  const newChat = () => {
    conversationRef.current += 1;
    setMessages([]);
    setError(null);
    setLoading(false);
  };

  const exportChat = () => {
    const transcript = messages
      .map((m) => `**${m.role === 'user' ? 'You' : 'GemVision'}:**${m.image ? ' _(image attached)_' : ''}\n\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([`# GemVision conversation\n\n${transcript}\n`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemvision-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-dvh flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header hasMessages={messages.length > 0} onNewChat={newChat} onExport={exportChat} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4">
          {messages.length === 0 ? (
            <EmptyState onPick={(text) => send(text)} />
          ) : (
            <div className="flex flex-col gap-6 py-6">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {loading && <TypingIndicator />}
              {error && <ErrorNotice error={error} onRetry={() => requestReply(messages)} />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </main>

      <Composer disabled={loading} onSend={send} />
    </div>
  );
}

export default App;
