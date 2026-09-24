import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { prepareImage } from '../lib/image';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string, image?: string) => void;
}

const Composer = ({ disabled, onSend }: ComposerProps) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string>();
  const [imageError, setImageError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Grow the textarea with its content, up to a limit.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const canSend = !disabled && (text.trim().length > 0 || !!image);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim(), image);
    setText('');
    setImage(undefined);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file (PNG, JPEG, GIF or WebP).');
      return;
    }
    try {
      setImage(await prepareImage(file));
      textareaRef.current?.focus();
    } catch {
      setImageError("Couldn't read that image. Please try a different one.");
    }
  };

  return (
    <div className="border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950">
      <form onSubmit={submit} className="mx-auto max-w-3xl px-4 pb-3 pt-3">
        <div className="rounded-2xl border border-zinc-300 bg-white shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900">
          {image && (
            <div className="relative ml-3 mt-3 inline-block">
              <img src={image} alt="Attachment preview" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImage(undefined)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-0.5 text-white shadow hover:bg-zinc-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1 p-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach image"
              title="Attach image"
              className="shrink-0 rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Message GemVision…"
              className="max-h-[200px] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 placeholder:text-zinc-400 focus:outline-none sm:text-[15px]"
            />

            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white transition hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              <ArrowUpIcon className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {imageError ? (
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">{imageError}</p>
        ) : (
          <p className="mt-2 text-center text-xs text-zinc-400">
            GemVision uses Google Gemini and can make mistakes. Check important info.
          </p>
        )}
      </form>
    </div>
  );
};

export default Composer;
