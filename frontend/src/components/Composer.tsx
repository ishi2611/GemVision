import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, MicrophoneIcon, PhotoIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { prepareImage } from '../lib/image';
import { IMAGE_ACTIONS } from '../lib/modes';
import { getRecognition } from '../lib/speech';

export interface Draft {
  text: string;
  image?: string;
  /** Changes every time a draft is loaded, so loading the same text twice still works. */
  key: number;
}

interface ComposerProps {
  disabled: boolean;
  draft?: Draft;
  onSend: (text: string, image?: string) => void;
}

const Composer = ({ disabled, draft, onSend }: ComposerProps) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string>();
  const [imageError, setImageError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [canListen] = useState(() => getRecognition() !== null);

  // "Edit" on a sent message loads it back in here.
  useEffect(() => {
    if (!draft) return;
    setText(draft.text);
    setImage(draft.image);
    textareaRef.current?.focus();
  }, [draft]);

  // Grow the textarea with its content, up to a limit.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

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

  // Let people drop an image anywhere on the page.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files');
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(false);
      onFile(e.dataTransfer?.files[0]);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = getRecognition();
    if (!recognition) return;
    const before = text ? `${text.trimEnd()} ` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const heard = Array.from(e.results as ArrayLike<SpeechRecognitionResult>)
        .map((r) => r[0].transcript)
        .join('');
      setText(before + heard);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const canSend = !disabled && (text.trim().length > 0 || !!image);

  const submit = (e?: FormEvent, override?: string) => {
    e?.preventDefault();
    const message = (override ?? text).trim();
    if (disabled || (!message && !image)) return;
    recognitionRef.current?.stop();
    onSend(message, image);
    setText('');
    setImage(undefined);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const iconButton =
    'shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100';

  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[1px]">
          <div className="rounded-2xl border-2 border-dashed border-indigo-500 bg-white px-8 py-6 text-sm font-medium text-indigo-700 shadow-lg dark:bg-slate-800 dark:text-indigo-300">
            Drop the image to attach it
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mx-auto max-w-3xl px-4 pb-3 pt-2">
        {image && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {IMAGE_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={disabled}
                onClick={() => submit(undefined, action.prompt)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800">
          {image && (
            <div className="relative ml-3 mt-3 inline-block">
              <img src={image} alt="Attachment preview" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImage(undefined)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 rounded-full bg-slate-800 p-0.5 text-white shadow hover:bg-slate-700"
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
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach image" title="Attach image" className={iconButton}>
              <PhotoIcon className="h-5 w-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={(e) => {
                const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith('image/'));
                if (file) {
                  e.preventDefault();
                  onFile(file);
                }
              }}
              rows={1}
              placeholder={listening ? 'Listening…' : image ? 'Ask about this image, or pick an action above…' : 'Message GemVision…'}
              className="max-h-[200px] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-[15px] dark:text-slate-100"
            />

            {canListen && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={listening ? 'Stop voice input' : 'Voice input'}
                title={listening ? 'Stop voice input' : 'Voice input'}
                className={listening ? 'shrink-0 animate-pulse rounded-xl bg-red-50 p-2 text-red-600 dark:bg-red-500/10 dark:text-red-400' : iconButton}
              >
                {listening ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
              </button>
            )}

            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
            >
              <ArrowUpIcon className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {imageError ? (
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">{imageError}</p>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-400">
            GemVision can make mistakes. Check important info.
          </p>
        )}
      </form>
    </div>
  );
};

export default Composer;
