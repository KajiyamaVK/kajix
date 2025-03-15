/**
 * LLM-related types
 */

/**
 * Standard LLM types
 */
export enum LLMType {
  TEXT = "text",
  AUDIO = "audio",
  WEB_SEARCH = "web_search",
  TRANSCRIPTION = "transcription",
  SPEECH = "speech",
  IMAGE = "image",
  EMBEDDING = "embedding",
}

/**
 * LLM Company data
 */
export interface LLMCompany {
  id: number;
  name: string;
  website: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LLM Model data
 */
export interface LLMModel {
  id: number;
  name: string;
  version: string;
  contextSize: number;
  isActive: boolean;
  llmCompanyId: number;
  llmCompany?: LLMCompany;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data used for creating LLM companies in factories
 */
export interface LLMFactoryData {
  name?: string;
  website?: string;
  isActive?: boolean;
}

/**
 * Data used for creating LLM models in factories
 */
export interface LLMModelFactoryData {
  name?: string;
  version?: string;
  contextSize?: number;
  isActive?: boolean;
  llmCompanyId?: number;
}

/**
 * Data for creating a new LLM company
 */
export interface CreateLLMDto {
  name: string;
  website: string;
  isActive?: boolean;
}

/**
 * Data for updating an LLM company
 */
export interface UpdateLLMDto {
  name?: string;
  website?: string;
  isActive?: boolean;
}

/**
 * Data for creating a new LLM model
 */
export interface CreateLLMModelDto {
  name: string;
  version: string;
  contextSize: number;
  isActive?: boolean;
  llmCompanyId: number;
}

/**
 * Data for updating an LLM model
 */
export interface UpdateLLMModelDto {
  name?: string;
  version?: string;
  contextSize?: number;
  isActive?: boolean;
  llmCompanyId?: number;
}
