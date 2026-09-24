import { CameraIcon, MicrophoneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { MODES, SUGGESTIONS } from '../lib/modes';
import { Mode } from '../types';
import Logo from './Logo';

const FEATURES = [
  { Icon: CameraIcon, text: 'Paste, drop or attach an image to analyze it' },
  { Icon: MicrophoneIcon, text: 'Speak your question with the mic' },
  { Icon: SparklesIcon, text: 'Switch modes for code, writing or tutoring' },
];

const EmptyState = ({ mode, onPick }: { mode: Mode; onPick: (text: string) => void }) => {
  const current = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
      <Logo className="h-12 w-12 drop-shadow-sm" />
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        How can I help today?
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        <span className="font-medium text-indigo-600 dark:text-indigo-400">{current.label} mode:</span>{' '}
        {current.description.toLowerCase()}.
      </p>

      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS[mode].map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-indigo-500/60"
          >
            {text}
          </button>
        ))}
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        {FEATURES.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-indigo-500" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmptyState;
