/**
 * Standard error interface for LLM services
 */
export interface LLMServiceError extends Error {
  message: string;
  name: string;
  code?: string;
  status?: number;
  cause?: unknown;
  stack?: string;
}

/**
 * Provider-specific error interface for OpenAI
 */
export interface OpenAIError extends LLMServiceError {
  status: number;
  headers?: Record<string, string>;
  type?: string;
  code?: string;
  param?: string;
}

/**
 * Provider-specific error interface for Anthropic
 */
export interface AnthropicError extends LLMServiceError {
  status: number;
  type?: string;
}

/**
 * Provider-specific error interface for Ollama
 */
export interface OllamaError extends LLMServiceError {
  code?: string;
}

/**
 * Guard function to check if an error is a specific type of error
 */
export function isLLMServiceError(error: unknown): error is LLMServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as LLMServiceError).message === 'string'
  );
}

/**
 * Guard function to check if an error is a batch size error
 */
export function isBatchSizeError(error: unknown): boolean {
  if (!isLLMServiceError(error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('batch size') ||
    errorMessage.includes('too many items') ||
    errorMessage.includes('too many inputs') ||
    errorMessage.includes('context length') ||
    errorMessage.includes('token limit') ||
    (error.code !== undefined && ['context_length_exceeded', 'token_limit_exceeded'].includes(error.code))
  );
}
