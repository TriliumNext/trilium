/**
 * Consolidated Context Services
 *
 * This file exports the centralized context-related services that have been
 * consolidated from previously overlapping implementations:
 *
 * - ContextService: Main entry point for context extraction operations
 * - QueryProcessor: Query enhancement and decomposition
 */

import contextService from './context_service.js';
import queryProcessor from './query_processor.js';

export {
  contextService,
  queryProcessor
};

// Export types
export type { ContextOptions } from './context_service.js';
export type { SubQuery, DecomposedQuery } from './query_processor.js';

// Default export for backwards compatibility
export default contextService;
