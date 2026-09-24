import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmptyState from './components/EmptyState';
import ChatMessage, { TypingIndicator } from './components/ChatMessage';
import ErrorNotice from './components/ErrorNotice';
import Composer, { Draft } from './components/Composer';
import { ChatError, sendChat } from './lib/api';
import { loadChats, loadTheme, saveChats, saveTheme } from './lib/storage';
import { ChatErrorState, Conversation, Message, Mode, Theme } from './types';

const newId = (): string => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const titleFor = (message: Message) => {
  const text = message.content.replace(/\s+/g, ' ').trim();
  if (!text) return 'Image chat';
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
};

function App() {
  const [chats, setChats] = useState<Conversation[]>(loadChats);
  const [activeId, setActiveId] = useState(newId);
  // Mode picked for a chat that has no messages yet (and so isn't saved).
  const [draftMode, setDraftMode] = useState<Mode>('general');
  // The chat currently waiting for a reply. Only one request runs at a time.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<(ChatErrorState & { chatId: string }) | null>(null);
  const [draft, setDraft] = useState<Draft>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const bottomRef = useRef<HTMLDivElement>(null);

  const active = chats.find((c) => c.id === activeId);
  const messages = active?.messages ?? [];
  const mode = active?.mode ?? draftMode;
  const loading = pendingId === activeId;
  const activeError = error?.chatId === activeId ? error : null;

  useEffect(() => saveChats(chats), [chats]);

  useEffect(() => {
    saveTheme(theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f172a' : '#f8fafc');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading, activeError, activeId]);

  /** Replace a chat's messages, creating the chat on its first message and moving it to the top. */
  const setChatMessages = (chatId: string, chatMode: Mode, update: (prev: Message[]) => Message[]) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.id === chatId);
      const next = update(existing?.messages ?? []);
      const firstUser = next.find((m) => m.role === 'user');
      const chat: Conversation = {
        id: chatId,
        mode: existing?.mode ?? chatMode,
        title: existing?.title ?? (firstUser ? titleFor(firstUser) : 'New chat'),
        messages: next,
        updatedAt: Date.now(),
      };
      return [chat, ...prev.filter((c) => c.id !== chatId)];
    });
  };

  // Ask the model to reply to the last (user) message in `conversation`.
  const requestReply = async (chatId: string, chatMode: Mode, conversation: Message[]) => {
    const last = conversation[conversation.length - 1];
    setPendingId(chatId);
    setError(null);

    try {
      const reply = await sendChat({
        message: last.content,
        image: last.image,
        history: conversation.slice(0, -1),
        mode: chatMode,
      });
      // The chat may have been deleted while waiting; only add the reply if it still exists.
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...c.messages, { id: newId(), role: 'assistant', content: reply }], updatedAt: Date.now() }
            : c,
        ),
      );
    } catch (e) {
      const err = e instanceof ChatError ? e : new ChatError('Something went wrong. Please try again.');
      setError({
        chatId,
        message: err.message,
        retryAt: err.retryAfter ? Date.now() + err.retryAfter * 1000 : undefined,
      });
    } finally {
      setPendingId(null);
    }
  };

  const send = (text: string, image?: string) => {
    if (pendingId) return;
    const next = [...messages, { id: newId(), role: 'user' as const, content: text, image }];
    setChatMessages(activeId, mode, () => next);
    requestReply(activeId, mode, next);
  };

  const newChat = () => {
    setActiveId(newId());
    setDraftMode(mode);
    setDraft(undefined);
    setSidebarOpen(false);
  };

  const selectChat = (id: string) => {
    setActiveId(id);
    setDraft(undefined);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(newId());
    if (error?.chatId === id) setError(null);
  };

  const changeMode = (next: Mode) => {
    if (active) setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, mode: next } : c)));
    else setDraftMode(next);
  };

  // Put the last question back in the composer and drop it (and its answer) from the chat.
  const editLast = (index: number) => {
    const message = messages[index];
    setChatMessages(activeId, mode, (prev) => prev.slice(0, index));
    setError(null);
    setDraft({ text: message.content, image: message.image, key: Date.now() });
  };

  const regenerate = () => {
    const withoutReply = messages.slice(0, -1);
    setChatMessages(activeId, mode, () => withoutReply);
    requestReply(activeId, mode, withoutReply);
  };

  const exportChat = () => {
    const transcript = messages
      .map((m) => `**${m.role === 'user' ? 'You' : 'GemVision'}:**${m.image ? ' _(image attached)_' : ''}\n\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([`# ${active?.title ?? 'GemVision conversation'}\n\n${transcript}\n`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemvision-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lastUserIndex = messages.map((m) => m.role).lastIndexOf('user');
  const lastIsReply = messages[messages.length - 1]?.role === 'assistant';

  return (
    <div className="flex h-dvh bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={sidebarOpen}
        theme={theme}
        onClose={() => setSidebarOpen(false)}
        onNewChat={newChat}
        onSelect={selectChat}
        onDelete={deleteChat}
        onTheme={setTheme}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <Header
          title={active?.title ?? 'New chat'}
          mode={mode}
          hasMessages={messages.length > 0}
          onMenu={() => setSidebarOpen(true)}
          onMode={changeMode}
          onExport={exportChat}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4">
            {messages.length === 0 ? (
              <EmptyState mode={mode} onPick={(text) => send(text)} />
            ) : (
              <div className="flex flex-col gap-6 py-6">
                {messages.map((m, i) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    onEdit={!pendingId && i === lastUserIndex ? () => editLast(i) : undefined}
                    onRegenerate={!pendingId && lastIsReply && i === messages.length - 1 ? regenerate : undefined}
                  />
                ))}
                {loading && <TypingIndicator />}
                {activeError && (
                  <ErrorNotice error={activeError} onRetry={() => requestReply(activeId, mode, messages)} />
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        <Composer disabled={!!pendingId} draft={draft} onSend={send} />
      </div>
    </div>
  );
}

export default App;
