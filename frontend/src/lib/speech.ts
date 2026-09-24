// Browser speech APIs: free, no server needed. Recognition works in Chrome, Edge and Safari.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Recognition = any;

export function getRecognition(): Recognition | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  return recognition;
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Turn Markdown into plain sentences so the voice doesn't read out symbols. */
function toSpeakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' (code block) ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(markdown: string, onEnd: () => void) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(toSpeakable(markdown));
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}

export const stopSpeaking = () => window.speechSynthesis.cancel();
