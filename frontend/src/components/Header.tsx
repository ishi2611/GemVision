import { ArrowDownTrayIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';

interface HeaderProps {
  hasMessages: boolean;
  onNewChat: () => void;
  onExport: () => void;
}

const Header = ({ hasMessages, onNewChat, onExport }: HeaderProps) => (
  <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
    <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="text-base font-semibold tracking-tight">GemVision</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onExport}
          disabled={!hasMessages}
          title="Download conversation"
          aria-label="Download conversation"
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          disabled={!hasMessages}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <PencilSquareIcon className="h-5 w-5" />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </div>
    </div>
  </header>
);

export default Header;
