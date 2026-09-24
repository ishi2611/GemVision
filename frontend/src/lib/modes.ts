import { Mode } from '../types';

export const MODES: { id: Mode; label: string; description: string }[] = [
  { id: 'general', label: 'General', description: 'Everyday questions and ideas' },
  { id: 'code', label: 'Code', description: 'Write, explain and debug code' },
  { id: 'writing', label: 'Writing', description: 'Polish emails, essays and posts' },
  { id: 'tutor', label: 'Tutor', description: 'Step-by-step explanations' },
];

export const SUGGESTIONS: Record<Mode, string[]> = {
  general: [
    'Plan a 3-day trip to Tokyo on a student budget',
    'Give me 5 ideas for a weekend coding project',
    'What are good habits for staying focused while studying?',
    'Compare renting vs buying a home in a simple table',
  ],
  code: [
    'Write a Python function that removes duplicates from a list, keeping order',
    'Explain the difference between let, const and var in JavaScript',
    'How do I center a div with CSS grid and flexbox?',
    'Write a SQL query for the top 3 customers by total spend',
  ],
  writing: [
    'Write a polite email asking for a deadline extension',
    'Turn these notes into a LinkedIn post: shipped my first app, learned React',
    'Make this sound more professional: hey, can u send the report asap',
    'Write a short cover letter opening for a software internship',
  ],
  tutor: [
    'Explain how neural networks learn, in simple terms',
    'What is compound interest? Show an example',
    'Teach me recursion with a real-life analogy',
    'How does photosynthesis work?',
  ],
};

/** One-tap prompts shown when an image is attached. */
export const IMAGE_ACTIONS = [
  { label: 'Describe', prompt: 'Describe this image in detail.' },
  { label: 'Extract text', prompt: 'Extract all the text from this image exactly as written. Keep the layout where you can.' },
  { label: 'Solve', prompt: 'Solve the problem shown in this image step by step.' },
  { label: 'Translate', prompt: 'Translate any text in this image into English.' },
  { label: 'Explain chart', prompt: 'Explain what this chart or diagram shows and the key takeaways.' },
];
