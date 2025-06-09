import type { ChatResponse } from '../ai_interface.js';
// VectorSearchResult type definition moved here since vector search tool was removed
export interface VectorSearchResult {
    searchResults: Array<any>;
    totalResults: number;
    executionTime: number;
}
import type { NoteInfo, NotePathInfo, NoteHierarchyLevel } from '../context_extractors/note_navigator_tool.js';
import type { DecomposedQuery, SubQuery } from '../context_extractors/query_decomposition_tool.js';
import type { ThinkingProcess, ThinkingStep } from '../context_extractors/contextual_thinking_tool.js';
import type BAttribute from '../../../becca/entities/battribute.js';

/**
 * Interface for the AI service used by agent tools
 */
export interface LLMServiceInterface {
    generateChatCompletion(messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>, options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
        stream?: boolean;
        systemPrompt?: string;
    }): Promise<ChatResponse>;
}

/**
 * Interface for tool initialization
 */
export interface AgentToolInitializationParams {
    aiServiceManager: LLMServiceInterface;
}

/**
 * Interface for agent tool manager
 */
export interface IAgentToolsManager {
    initialize(aiServiceManager: LLMServiceInterface): Promise<void>;
    isInitialized(): boolean;
    getAllTools(): {
        vectorSearch: IVectorSearchTool;
        noteNavigator: INoteNavigatorTool;
        queryDecomposition: IQueryDecompositionTool;
        contextualThinking: IContextualThinkingTool;
    };
    getVectorSearchTool(): IVectorSearchTool;
    getNoteNavigatorTool(): INoteNavigatorTool;
    getQueryDecompositionTool(): IQueryDecompositionTool;
    getContextualThinkingTool(): IContextualThinkingTool;
}

/**
 * Interface for context service used by vector search
 */
export interface IContextService {
    findRelevantNotesMultiQuery(queries: string[], contextNoteId: string | null, limit: number): Promise<VectorSearchResult[]>;
    processQuery(userQuestion: string, llmService: LLMServiceInterface, contextNoteId: string | null, showThinking: boolean): Promise<{
        context: string;
        sources: Array<{
            noteId: string;
            title: string;
            similarity: number;
        }>;
        thinking?: string;
    }>;
}

/**
 * Interface for vector search tool
 */
export interface IVectorSearchTool {
    setContextService(contextService: IContextService): void;
    search(
        query: string,
        contextNoteId?: string,
        searchOptions?: {
            limit?: number;
            threshold?: number;
            includeContent?: boolean;
        }
    ): Promise<VectorSearchResult[]>;
    searchNotes(query: string, options?: {
        parentNoteId?: string;
        maxResults?: number;
        similarityThreshold?: number;
    }): Promise<VectorSearchResult[]>;
    searchContentChunks(query: string, options?: {
        noteId?: string;
        maxResults?: number;
        similarityThreshold?: number;
    }): Promise<VectorSearchResult[]>;
    explainResults(query: string, results: VectorSearchResult[]): string;
}

/**
 * Interface for note navigator tool
 */
export interface INoteNavigatorTool {
    getNoteInfo(noteId: string): NoteInfo | null;
    getNotePathsFromRoot(noteId: string): NotePathInfo[];
    getNoteHierarchy(noteId: string, depth?: number): NoteHierarchyLevel | null;
    getNoteAttributes(noteId: string): BAttribute[];
    findPathBetweenNotes(fromNoteId: string, toNoteId: string): NotePathInfo | null;
    searchNotesByTitle(searchTerm: string, limit?: number): NoteInfo[];
    getNoteClones(noteId: string): Promise<NoteInfo[]>;
    getNoteContextDescription(noteId: string): Promise<string>;
    getNoteStructure(noteId: string): Promise<{
        noteId: string;
        title: string;
        type: string;
        childCount: number;
        attributes: Array<{ name: string, value: string }>;
        parentPath: Array<{ title: string, noteId: string }>;
    }>;
    getChildNotes(noteId: string, limit?: number): Promise<Array<{ noteId: string, title: string }>>;
    getParentNotes(noteId: string): Promise<Array<{ noteId: string, title: string }>>;
    getLinkedNotes(noteId: string, limit?: number): Promise<Array<{ noteId: string, title: string, direction: 'from' | 'to' }>>;
    getNotePath(noteId: string): Promise<string>;
}

/**
 * Interface for query decomposition tool
 */
export interface IQueryDecompositionTool {
    decomposeQuery(query: string, context?: string): DecomposedQuery;
    updateSubQueryAnswer(decomposedQuery: DecomposedQuery, subQueryId: string, answer: string): DecomposedQuery;
    synthesizeAnswer(decomposedQuery: DecomposedQuery): string;
    getQueryStatus(decomposedQuery: DecomposedQuery): string;
    assessQueryComplexity(query: string): number;
    generateSubQueryId(): string;
    createSubQueries(query: string, context?: string): SubQuery[];
}

/**
 * Interface for contextual thinking tool
 */
export interface IContextualThinkingTool {
    startThinking(query: string): string;
    addThinkingStep(
        processId: string,
        step: Omit<ThinkingStep, 'id'>,
        parentId?: string
    ): string;
    completeThinking(processId?: string): ThinkingProcess | null;
    getThinkingProcess(processId: string): ThinkingProcess | null;
    getActiveThinkingProcess(): ThinkingProcess | null;
    visualizeThinking(thinkingId: string): string;
    getThinkingSummary(thinkingId: string): string;
    resetActiveThinking(): void;
}
