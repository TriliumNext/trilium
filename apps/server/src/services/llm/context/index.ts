/**
 * Context extraction module for LLM features
 * Provides methods to extract relevant context from notes for LLM processing
 */

import becca from '../../../becca/becca.js';
import { getNoteContent, formatNoteContent, sanitizeHtmlContent } from './note_content.js';
import { detectLanguage, extractCodeStructure } from './code_handlers.js';
import { chunkContent, semanticChunking } from './content_chunking.js';
import type { ContentChunk, ChunkOptions } from './content_chunking.js';
import { summarizeContent, extractKeyPoints } from './summarization.js';
import { getParentNotes, getParentContext, getChildContext, getLinkedNotesContext } from './hierarchy.js';
import { SEARCH_CONSTANTS } from '../constants/search_constants.js';

/**
 * Get semantic context
 * This is now a wrapper that redirects to the new context service
 * @param noteId - The ID of the note to get context for
 * @param options - Options for semantic context
 * @returns Semantic context string
 */
async function getSemanticContext(
    noteId: string,
    options: { maxSimilarNotes?: number } = {}
): Promise<string> {
    // Use the context service
    try {
        const { default: aiServiceManager } = await import('../ai_service_manager.js');
        const contextService = aiServiceManager.getInstance().getContextService();

        if (!contextService) {
            return "Semantic context service not available.";
        }

        // Get an LLM service
        const llmService = await aiServiceManager.getInstance().getService();

        const result = await contextService.processQuery("", llmService, {
            maxResults: options.maxSimilarNotes || 5,
            contextNoteId: noteId
        });
        return result.context;
    } catch (error) {
        console.error("Error getting semantic context:", error);
        return "Error retrieving semantic context.";
    }
}

/**
 * Options for context extraction
 */
export interface ContextOptions {
    /**
     * Include parent context
     */
    includeParents?: boolean;

    /**
     * Include child notes in context
     */
    includeChildren?: boolean;

    /**
     * Include linked notes in context
     */
    includeLinks?: boolean;

    /**
     * Include semantically similar notes
     */
    includeSimilar?: boolean;

    /**
     * Include note content in context
     */
    includeContent?: boolean;

    /**
     * Maximum depth for parent hierarchy
     */
    maxParentDepth?: number;

    /**
     * Maximum number of children to include
     */
    maxChildren?: number;

    /**
     * Maximum number of linked notes to include
     */
    maxLinks?: number;

    /**
     * Maximum number of similar notes to include
     */
    maxSimilarNotes?: number;

    /**
     * Maximum content length
     */
    maxContentLength?: number;
}

/**
 * Default options for context extraction
 */
const DEFAULT_CONTEXT_OPTIONS: Required<ContextOptions> = {
    includeParents: true,
    includeChildren: true,
    includeLinks: true,
    includeSimilar: false,
    includeContent: true,
    maxParentDepth: SEARCH_CONSTANTS.CONTEXT.MAX_PARENT_DEPTH,
    maxChildren: SEARCH_CONSTANTS.CONTEXT.MAX_CHILDREN,
    maxLinks: SEARCH_CONSTANTS.CONTEXT.MAX_LINKS,
    maxSimilarNotes: SEARCH_CONSTANTS.CONTEXT.MAX_SIMILAR_NOTES,
    maxContentLength: SEARCH_CONSTANTS.CONTEXT.MAX_CONTENT_LENGTH
};

/**
 * Context Extractor class
 * Handles extraction of context from notes for LLM processing
 */
export class ContextExtractor {
    /**
     * Get content of a note
     */
    static async getNoteContent(noteId: string): Promise<string | null> {
        return getNoteContent(noteId);
    }

    /**
     * Get content of a note - instance method
     */
    async getNoteContent(noteId: string): Promise<string | null> {
        return ContextExtractor.getNoteContent(noteId);
    }

    /**
     * Format note content based on its type
     */
    static formatNoteContent(content: string, type: string, mime: string, title: string): string {
        return formatNoteContent(content, type, mime, title);
    }

    /**
     * Format note content based on its type - instance method
     */
    formatNoteContent(content: string, type: string, mime: string, title: string): string {
        return ContextExtractor.formatNoteContent(content, type, mime, title);
    }

    /**
     * Sanitize HTML content to plain text
     */
    static sanitizeHtmlContent(html: string): string {
        return sanitizeHtmlContent(html);
    }

    /**
     * Sanitize HTML content to plain text - instance method
     */
    sanitizeHtmlContent(html: string): string {
        return ContextExtractor.sanitizeHtmlContent(html);
    }

    /**
     * Detect programming language from content
     */
    static detectLanguage(content: string, mime: string): string {
        return detectLanguage(content, mime);
    }

    /**
     * Detect programming language from content - instance method
     */
    detectLanguage(content: string, mime: string): string {
        return ContextExtractor.detectLanguage(content, mime);
    }

    /**
     * Extract structure from code
     */
    static extractCodeStructure(content: string, language: string): string {
        return extractCodeStructure(content, language);
    }

    /**
     * Extract structure from code - instance method
     */
    extractCodeStructure(content: string, language: string): string {
        return ContextExtractor.extractCodeStructure(content, language);
    }

    /**
     * Chunk content into smaller pieces
     */
    static async chunkContent(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return chunkContent(content, title, noteId, options);
    }

    /**
     * Chunk content into smaller pieces - instance method
     */
    async chunkContent(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return ContextExtractor.chunkContent(content, title, noteId, options);
    }

    /**
     * Smarter chunking that respects semantic boundaries
     */
    static async semanticChunking(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return semanticChunking(content, title, noteId, options);
    }

    /**
     * Smarter chunking that respects semantic boundaries - instance method
     */
    async semanticChunking(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return ContextExtractor.semanticChunking(content, title, noteId, options);
    }

    /**
     * Summarize content
     */
    static summarizeContent(
        content: string,
        title: string = ''
    ): string {
        return summarizeContent(content, title);
    }

    /**
     * Summarize content - instance method
     */
    summarizeContent(
        content: string,
        title: string = ''
    ): string {
        return ContextExtractor.summarizeContent(content, title);
    }

    /**
     * Extract key points from content
     */
    static extractKeyPoints(
        content: string,
        maxPoints: number = SEARCH_CONSTANTS.CONTEXT.MAX_POINTS
    ): string[] {
        return extractKeyPoints(content, maxPoints);
    }

    /**
     * Extract key points from content - instance method
     */
    extractKeyPoints(
        content: string,
        maxPoints: number = SEARCH_CONSTANTS.CONTEXT.MAX_POINTS
    ): string[] {
        return ContextExtractor.extractKeyPoints(content, maxPoints);
    }

    /**
     * Get parent notes
     */
    static async getParentNotes(
        noteId: string,
        maxParents: number = SEARCH_CONSTANTS.CONTEXT.MAX_POINTS
    ): Promise<{id: string, title: string}[]> {
        return getParentNotes(noteId, maxParents);
    }

    /**
     * Get parent notes - instance method
     */
    async getParentNotes(
        noteId: string,
        maxParents: number = SEARCH_CONSTANTS.CONTEXT.MAX_POINTS
    ): Promise<{id: string, title: string}[]> {
        return ContextExtractor.getParentNotes(noteId, maxParents);
    }

    /**
     * Get hierarchical parent context
     */
    static async getParentContext(
        noteId: string,
        maxDepth: number = SEARCH_CONSTANTS.CONTEXT.MAX_PARENT_DEPTH,
        maxParents: number = SEARCH_CONSTANTS.CONTEXT.MAX_PARENT_DEPTH
    ): Promise<string> {
        return getParentContext(noteId, maxDepth, maxParents);
    }

    /**
     * Get hierarchical parent context - instance method
     */
    async getParentContext(
        noteId: string,
        maxDepth: number = SEARCH_CONSTANTS.CONTEXT.MAX_PARENT_DEPTH,
        maxParents: number = SEARCH_CONSTANTS.CONTEXT.MAX_PARENT_DEPTH
    ): Promise<string> {
        return ContextExtractor.getParentContext(noteId, maxDepth, maxParents);
    }

    /**
     * Get child context
     */
    static async getChildContext(
        noteId: string,
        maxChildren: number = SEARCH_CONSTANTS.CONTEXT.MAX_CHILDREN,
        includeContent: boolean = false
    ): Promise<string> {
        return getChildContext(noteId, maxChildren, includeContent);
    }

    /**
     * Get child context - instance method
     */
    async getChildContext(
        noteId: string,
        maxChildren: number = SEARCH_CONSTANTS.CONTEXT.MAX_CHILDREN,
        includeContent: boolean = false
    ): Promise<string> {
        return ContextExtractor.getChildContext(noteId, maxChildren, includeContent);
    }

    /**
     * Get linked notes context
     */
    static async getLinkedNotesContext(
        noteId: string,
        maxRelations: number = SEARCH_CONSTANTS.CONTEXT.MAX_RELATIONS
    ): Promise<string> {
        return getLinkedNotesContext(noteId, maxRelations);
    }

    /**
     * Get linked notes context - instance method
     */
    async getLinkedNotesContext(
        noteId: string,
        maxRelations: number = SEARCH_CONSTANTS.CONTEXT.MAX_RELATIONS
    ): Promise<string> {
        return ContextExtractor.getLinkedNotesContext(noteId, maxRelations);
    }

    /**
     * Get semantic context
     * This is now a wrapper that redirects to the new context service
     * @param noteId - The ID of the note to get context for
     * @param options - Options for semantic context
     * @returns Semantic context string
     */
    static async getSemanticContext(
        noteId: string,
        options: { maxSimilarNotes?: number } = {}
    ): Promise<string> {
        return getSemanticContext(noteId, options);
    }

    /**
     * Get semantic context - instance method
     */
    async getSemanticContext(
        noteId: string,
        options: { maxSimilarNotes?: number } = {}
    ): Promise<string> {
        return ContextExtractor.getSemanticContext(noteId, options);
    }

    /**
     * Extract full context for a note
     * This combines various context sources based on provided options
     */
    static async extractContext(
        noteId: string,
        options: ContextOptions = {}
    ): Promise<string> {
        const config: Required<ContextOptions> = { ...DEFAULT_CONTEXT_OPTIONS, ...options };
        const note = becca.getNote(noteId);

        if (!note) {
            return "Note not found.";
        }

        let context = `# Context for note: ${note.title}\n\n`;

        // Include parent context
        if (config.includeParents) {
            const parentContext = await ContextExtractor.getParentContext(
                noteId,
                config.maxParentDepth,
                3 // Default to 3 parents per level
            );

            if (parentContext) {
                context += `## Parent Hierarchy\n${parentContext}\n\n`;
            }
        }

        // Include note content
        if (config.includeContent) {
            const content = await ContextExtractor.getNoteContent(noteId);

            if (content) {
                // If content is too large, summarize it
                let contentSection = '';

                if (content.length > config.maxContentLength) {
                    contentSection = ContextExtractor.summarizeContent(content, note.title);
                    contentSection += "\n\n[Content summarized due to length]";
                } else {
                    contentSection = content;
                }

                context += `## Note Content\n${contentSection}\n\n`;
            }
        }

        // Include child context
        if (config.includeChildren) {
            const childContext = await ContextExtractor.getChildContext(
                noteId,
                config.maxChildren,
                false // Don't include child content by default
            );

            if (childContext && childContext !== "No child notes.") {
                context += `## Child Notes\n${childContext}\n\n`;
            }
        }

        // Include linked notes
        if (config.includeLinks) {
            const linkedContext = await ContextExtractor.getLinkedNotesContext(
                noteId,
                config.maxLinks
            );

            if (linkedContext && linkedContext !== "No linked notes.") {
                context += `## Linked Notes\n${linkedContext}\n\n`;
            }
        }

        // Include semantically similar notes
        if (config.includeSimilar) {
            const semanticContext = await ContextExtractor.getSemanticContext(
                noteId,
                { maxSimilarNotes: config.maxSimilarNotes }
            );

            if (semanticContext && !semanticContext.includes("No semantically similar notes found.")) {
                context += `## Similar Notes\n${semanticContext}\n\n`;
            }
        }

        return context;
    }

    /**
     * Extract full context for a note - instance method
     */
    async extractContext(
        noteId: string,
        options: ContextOptions = {}
    ): Promise<string> {
        return ContextExtractor.extractContext(noteId, options);
    }

    /**
     * Get progressively loaded context based on depth level
     * This provides different levels of context detail depending on the depth parameter
     *
     * @param noteId - The ID of the note to get context for
     * @param depth - Depth level (1-4) determining how much context to include
     * @returns Context appropriate for the requested depth
     */
    static async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        try {
            const { default: aiServiceManager } = await import('../ai_service_manager.js');
            const contextService = aiServiceManager.getInstance().getContextService();

            if (!contextService) {
                return "Context service not available.";
            }

            const results = await contextService.findRelevantNotes(
                "", // Empty query to get general context
                noteId,
                { maxResults: depth * 5 }
            );

            // Format the results
            let contextText = `Progressive context for note (depth ${depth}):\n\n`;
            results.forEach((note, index) => {
                contextText += `[${index + 1}] ${note.title}\n${note.content || 'No content'}\n\n`;
            });

            return contextText;
        } catch (error) {
            // Fall back to regular context if progressive loading fails
            console.error('Error in progressive context loading:', error);
            return ContextExtractor.extractContext(noteId);
        }
    }

    /**
     * Get progressively loaded context based on depth level - instance method
     */
    async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        return ContextExtractor.getProgressiveContext(noteId, depth);
    }

    /**
     * Get smart context based on the query complexity
     * This automatically selects the appropriate context depth and relevance
     *
     * @param noteId - The ID of the note to get context for
     * @param query - The user's query for semantic relevance matching
     * @returns The optimal context for answering the query
     */
    static async getSmartContext(noteId: string, query: string): Promise<string> {
        try {
            const { default: aiServiceManager } = await import('../ai_service_manager.js');
            const contextService = aiServiceManager.getInstance().getContextService();
            const llmService = await aiServiceManager.getInstance().getService();

            if (!contextService) {
                return "Context service not available.";
            }

            const result = await contextService.processQuery(
                query,
                llmService,
                { contextNoteId: noteId }
            );

            return result.context;
        } catch (error) {
            // Fall back to regular context if smart context fails
            console.error('Error in smart context selection:', error);
            return ContextExtractor.extractContext(noteId);
        }
    }

    /**
     * Get smart context based on the query complexity - instance method
     */
    async getSmartContext(noteId: string, query: string): Promise<string> {
        return ContextExtractor.getSmartContext(noteId, query);
    }

    /**
     * Get the full context for a note, including parent hierarchy, content, and children
     * Legacy method for backwards compatibility
     */
    static async getFullContext(noteId: string): Promise<string> {
        // Use extractContext with default options
        return ContextExtractor.extractContext(noteId);
    }

    /**
     * Get the full context for a note - instance method
     */
    async getFullContext(noteId: string): Promise<string> {
        return ContextExtractor.getFullContext(noteId);
    }

    /**
     * Get note hierarchy information in a formatted string
     * @param noteId - The ID of the note to get hierarchy information for
     * @returns Formatted string with note hierarchy information
     */
    static async getNoteHierarchyInfo(noteId: string): Promise<string> {
        const note = becca.getNote(noteId);
        if (!note) return 'Note not found';

        let info = `**Title**: ${note.title}\n`;

        // Add attributes if any
        const attributes = note.getAttributes();
        if (attributes && attributes.length > 0) {
            const relevantAttrs = attributes.filter(attr => !attr.name.startsWith('_'));
            if (relevantAttrs.length > 0) {
                info += `**Attributes**: ${relevantAttrs.map(attr => `${attr.name}=${attr.value}`).join(', ')}\n`;
            }
        }

        // Add parent path
        const parents = await ContextExtractor.getParentNotes(noteId);
        if (parents && parents.length > 0) {
            const path = parents.map(p => p.title).join(' > ');
            info += `**Path**: ${path}\n`;
        }

        // Add child count
        const childNotes = note.getChildNotes();
        if (childNotes && childNotes.length > 0) {
            info += `**Child notes**: ${childNotes.length}\n`;

            // List first few child notes
            const childList = childNotes.slice(0, 5).map(child => child.title).join(', ');
            if (childList) {
                info += `**Examples**: ${childList}${childNotes.length > 5 ? '...' : ''}\n`;
            }
        }

        // Add note type
        if (note.type) {
            info += `**Type**: ${note.type}\n`;
        }

        // Add creation/modification dates
        if (note.utcDateCreated) {
            info += `**Created**: ${new Date(note.utcDateCreated).toLocaleString()}\n`;
        }

        if (note.utcDateModified) {
            info += `**Modified**: ${new Date(note.utcDateModified).toLocaleString()}\n`;
        }

        return info;
    }

    /**
     * Get note hierarchy information - instance method
     */
    async getNoteHierarchyInfo(noteId: string): Promise<string> {
        return ContextExtractor.getNoteHierarchyInfo(noteId);
    }

    /**
     * Get note summary - for backward compatibility
     */
    static async getNoteSummary(noteId: string, maxLength = 5000): Promise<string> {
        const note = becca.getNote(noteId);
        if (!note) return '';

        const content = await getNoteContent(noteId);
        if (!content || content.length < maxLength) return content || '';

        // For larger content, generate a summary
        return summarizeContent(content, note.title);
    }

    /**
     * Get note summary - instance method
     */
    async getNoteSummary(noteId: string, maxLength = 5000): Promise<string> {
        return ContextExtractor.getNoteSummary(noteId, maxLength);
    }

    /**
     * Split a large note into smaller, semantically meaningful chunks
     * This is useful for handling large notes that exceed the context window of LLMs
     * For backward compatibility
     */
    static async getChunkedNoteContent(noteId: string, maxChunkSize = 2000): Promise<string[]> {
        const content = await getNoteContent(noteId);
        if (!content) return [];

        // Use the new chunking functionality
        const chunks = await ContextExtractor.chunkContent(
            content,
            '',
            noteId,
            { maxChunkSize, respectBoundaries: true }
        );

        // Convert to the old API format which was an array of strings
        return (await chunks).map(chunk => chunk.content);
    }

    /**
     * Split a large note into smaller chunks - instance method
     */
    async getChunkedNoteContent(noteId: string, maxChunkSize = 2000): Promise<string[]> {
        return ContextExtractor.getChunkedNoteContent(noteId, maxChunkSize);
    }
}

// Export all modules
export {
    getNoteContent,
    formatNoteContent,
    sanitizeHtmlContent,
    detectLanguage,
    extractCodeStructure,
    chunkContent,
    semanticChunking,
    summarizeContent,
    extractKeyPoints,
    getParentNotes,
    getParentContext,
    getChildContext,
    getLinkedNotesContext,
    getSemanticContext
};

// Export types
export type {
    ContentChunk,
    ChunkOptions
};
