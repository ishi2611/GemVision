import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ChatErrorState } from '../types';

const secondsUntil = (time?: number) => (time ? Math.max(0, Math.ceil((time - Date.now()) / 1000)) : 0);

const ErrorNotice = ({ error, onRetry }: { error: ChatErrorState; onRetry: () => void }) => {
  const [wait, setWait] = useState(() => secondsUntil(error.retryAt));

  useEffect(() => {
    setWait(secondsUntil(error.retryAt));
    if (!error.retryAt) return;
    const timer = setInterval(() => setWait(secondsUntil(error.retryAt)), 1000);
    return () => clearInterval(timer);
  }, [error.retryAt]);

  // Rate-limit messages contain a fixed number of seconds; show the live countdown instead.
  const text = error.retryAt
    ? 'GemVision is getting a lot of requests right now (free-tier limit).'
    : error.message;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
      <div className="flex flex-1 items-start gap-2">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{text}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={wait > 0}
        className="shrink-0 self-start rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
      >
        {wait > 0 ? `Retry in ${wait}s` : 'Retry'}
      </button>
    </div>
  );
};

export default ErrorNotice;
