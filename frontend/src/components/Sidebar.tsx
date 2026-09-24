import { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Conversation, Theme } from '../types';
import Logo from './Logo';

interface SidebarProps {
  chats: Conversation[];
  activeId: string;
  open: boolean;
  theme: Theme;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTheme: (theme: Theme) => void;
}

const THEMES: { id: Theme; label: string; Icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
  { id: 'system', label: 'System', Icon: ComputerDesktopIcon },
];

function groupLabel(time: number) {
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return 'Previous 7 days';
  return 'Older';
}

const Sidebar = ({ chats, activeId, open, theme, onClose, onNewChat, onSelect, onDelete, onTheme }: SidebarProps) => {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = chats.filter(
    (c) => c.messages.length > 0 && (!q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q))),
  );

  const groups: { label: string; items: Conversation[] }[] = [];
  for (const chat of visible) {
    const label = groupLabel(chat.updatedAt);
    const group = groups.find((g) => g.label === label);
    if (group) group.items.push(chat);
    else groups.push({ label, items: [chat] });
  }

  return (
    <>
      {/* Backdrop on small screens */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="font-semibold tracking-tight text-slate-900 dark:text-white">GemVision</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 lg:hidden dark:hover:bg-slate-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 px-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
            New chat
          </button>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-indigo-400 dark:border-slate-700 dark:bg-slate-800">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            />
          </label>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
          {groups.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-slate-400">
              {q ? 'No chats match your search.' : 'Your conversations will appear here.'}
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{group.label}</p>
              {group.items.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center rounded-lg text-sm transition ${
                    chat.id === activeId
                      ? 'bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700'
                      : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(chat.id)}
                    aria-label={`Delete ${chat.title}`}
                    title="Delete chat"
                    className="mr-1 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-200 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={theme === id}
                onClick={() => onTheme(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
                  theme === id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">Chats are saved in this browser only.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
