// Common LLM types that can be used as initial data
export const COMMON_LLM_TYPES = [
  {
    id: 1,
    type: 'text',
    isActive: true,
  },
  {
    id: 2,
    type: 'embedding',
    isActive: true,
  },
  {
    id: 3,
    type: 'transcription',
    isActive: true,
  },
  {
    id: 4,
    type: 'reasoning',
    isActive: true,
  },
  {
    id: 5,
    type: 'image',
    isActive: true,
  },
];

// Type enum for easier reference in code
export enum LLM_TYPE {
  TEXT = 'text',
  EMBEDDING = 'embedding',
  TRANSCRIPTION = 'transcription',
  REASONING = 'reasoning',
  IMAGE = 'image',
}
