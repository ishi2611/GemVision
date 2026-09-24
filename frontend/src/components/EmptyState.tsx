import Logo from './Logo';

const SUGGESTIONS = [
  'Explain how neural networks learn, in simple terms',
  'Write a polite email asking for a deadline extension',
  'Give me 5 ideas for a weekend coding project',
  'What are good habits for staying focused while studying?',
];

const EmptyState = ({ onPick }: { onPick: (text: string) => void }) => (
  <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
    <Logo className="h-12 w-12" />
    <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">How can I help today?</h1>
    <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
      Ask a question, or attach an image and GemVision will describe and analyze it.
    </p>

    <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onPick(text)}
          className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {text}
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
