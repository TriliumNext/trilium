/**
 * Interface for note data in cache
 */
export interface CachedNoteData<T> {
  timestamp: number;
  data: T;
}

/**
 * Interface for query results in cache
 */
export interface CachedQueryResults<T> {
  timestamp: number;
  results: T;
}

/**
 * Interface for cache manager
 */
export interface ICacheManager {
  getNoteData<T>(noteId: string, type: string): T | null;
  storeNoteData<T>(noteId: string, type: string, data: T): void;
  getQueryResults<T>(query: string, contextNoteId: string | null): T | null;
  storeQueryResults<T>(query: string, results: T, contextNoteId: string | null): void;
  cleanupCache(): void;
  clearAllCaches(): void;
}

/**
 * Interface for note data in search results
 */
export interface NoteSearchResult {
  noteId: string;
  title: string;
  content: string | null;
  similarity: number;
  parentId?: string;
  parentPath?: string;
  type?: string;
  mime?: string;
  parentTitle?: string;
  dateCreated?: string;
  dateModified?: string;
}

/**
 * Interface for context formatter
 */
export interface IContextFormatter {
  buildContextFromNotes(
    sources: NoteSearchResult[],
    query: string,
    providerId?: string,
    messages?: Array<{role: string, content: string}>
  ): Promise<string>;
}

/**
 * Interface for LLM Service
 */
export interface ILLMService {
  sendMessage(message: string, options?: Record<string, unknown>): Promise<string>;
  streamMessage?(message: string, callback: (text: string) => void, options?: Record<string, unknown>): Promise<string>;
}

/**
 * Interface for query enhancer
 */
export interface IQueryEnhancer {
  generateSearchQueries(question: string, llmService: ILLMService): Promise<string[]>;
  estimateQueryComplexity(query: string): number;
}

/**
 * Interface for content chunk
 */
export interface ContentChunk {
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for note chunk
 */
export interface NoteChunk {
  noteId: string;
  title: string;
  content: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for content chunking service
 */
export interface IContentChunker {
  chunkContent(content: string, metadata?: Record<string, unknown>): ContentChunk[];
  chunkNoteContent(noteId: string, content: string, title: string): Promise<NoteChunk[]>;
}

/**
 * Options for context service
 */
export interface ContextServiceOptions {
  maxResults?: number;
  summarize?: boolean;
  llmService?: ILLMService;
}

/**
 * Interface for context service
 */
export interface IContextService {
  initialize(): Promise<void>;
  processQuery(
    userQuestion: string,
    llmService: ILLMService,
    contextNoteId?: string | null,
    showThinking?: boolean
  ): Promise<{ context: string; sources: NoteSearchResult[]; thinking?: string }>;
  findRelevantNotes(
    query: string,
    contextNoteId?: string | null,
    options?: ContextServiceOptions
  ): Promise<NoteSearchResult[]>;
}
