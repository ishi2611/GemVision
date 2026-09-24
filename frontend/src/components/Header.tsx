import { ArrowDownTrayIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { MODES } from '../lib/modes';
import { Mode } from '../types';

interface HeaderProps {
  title: string;
  mode: Mode;
  hasMessages: boolean;
  onMenu: () => void;
  onMode: (mode: Mode) => void;
  onExport: () => void;
}

const Header = ({ title, mode, hasMessages, onMenu, onMode, onExport }: HeaderProps) => (
  <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
    <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open sidebar"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{title}</h1>

      <label className="sr-only" htmlFor="mode">
        Assistant mode
      </label>
      <select
        id="mode"
        value={mode}
        onChange={(e) => onMode(e.target.value as Mode)}
        title="Assistant mode"
        className="rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label} mode
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onExport}
        disabled={!hasMessages}
        title="Download conversation"
        aria-label="Download conversation"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
      </button>
    </div>
  </header>
);

export default Header;
