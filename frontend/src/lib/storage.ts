import { Conversation, Theme } from '../types';

const CHATS_KEY = 'gemvision.chats';
const THEME_KEY = 'gemvision.theme';
const MAX_CHATS = 50;

// Storage can be unavailable (private mode, blocked site data), so every access is guarded.

export function loadChats(): Conversation[] {
  try {
    const chats = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
    return Array.isArray(chats) ? chats : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: Conversation[]) {
  const recent = chats.slice(0, MAX_CHATS);
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(recent));
  } catch {
    // Images fill the ~5 MB browser quota quickly; keep the text if they don't fit.
    try {
      const textOnly = recent.map((c) => ({ ...c, messages: c.messages.map(({ image: _image, ...m }) => m) }));
      localStorage.setItem(CHATS_KEY, JSON.stringify(textOnly));
    } catch {
      // Nothing more we can do; the chat still works for this session.
    }
  }
}

export function loadTheme(): Theme {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === 'dark' || theme === 'system' ? theme : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore; the theme just won't be remembered.
  }
}
