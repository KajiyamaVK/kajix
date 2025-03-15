import { LLMType } from '@kajix/types';

// Common LLM types that can be used as initial data
export const COMMON_LLM_TYPES = [
  {
    id: 1,
    type: LLMType.TEXT,
    isActive: true,
  },
  {
    id: 2,
    type: LLMType.AUDIO,
    isActive: true,
  },
  {
    id: 3,
    type: LLMType.WEB_SEARCH,
    isActive: true,
  },
  {
    id: 4,
    type: LLMType.TRANSCRIPTION,
    isActive: true,
  },
  {
    id: 5,
    type: LLMType.SPEECH,
    isActive: true,
  },
  {
    id: 6,
    type: LLMType.IMAGE,
    isActive: true,
  },
  {
    id: 7,
    type: LLMType.EMBEDDING,
    isActive: true,
  },
];

// Type enum for easier reference in code
export enum LLM_TYPE {
  TEXT = 'text',
  AUDIO = 'audio',
  WEB_SEARCH = 'web_search',
  TRANSCRIPTION = 'transcription',
  SPEECH = 'speech',
  IMAGE = 'image',
  EMBEDDING = 'embedding',
}

// Re-export the enum for easier access
export { LLMType };
