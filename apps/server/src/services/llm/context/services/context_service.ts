/**
 * Unified Context Service
 *
 * Consolidates functionality from:
 * - context_service.ts (old version)
 * - semantic_search.ts
 * - vector_search_stage.ts
 *
 * This service provides a central interface for all context extraction operations,
 * supporting both full and summarized note content extraction.
 */

import log from '../../../log.js';
import cacheManager from '../modules/cache_manager.js';
import queryProcessor from './query_processor.js';
import contextFormatter from '../modules/context_formatter.js';
import aiServiceManager from '../../ai_service_manager.js';
import { ContextExtractor } from '../index.js';
import { CONTEXT_PROMPTS } from '../../constants/llm_prompt_constants.js';
import type { NoteSearchResult } from '../../interfaces/context_interfaces.js';
import type { LLMServiceInterface } from '../../interfaces/agent_tool_interfaces.js';

// Options for context processing
export interface ContextOptions {
    // Content options
    summarizeContent?: boolean;
    maxResults?: number;
    contextNoteId?: string | null;

    // Processing options
    useQueryEnhancement?: boolean;
    useQueryDecomposition?: boolean;

    // Debugging options
    showThinking?: boolean;
}

export class ContextService {
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private contextExtractor: ContextExtractor;

    constructor() {
        this.contextExtractor = new ContextExtractor();
    }

    /**
     * Initialize the service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Use a promise to prevent multiple simultaneous initializations
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Agent tools are already initialized in the AIServiceManager constructor
                // No need to initialize them again

                this.initialized = true;
                log.info(`Context service initialized`);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Failed to initialize context service: ${errorMessage}`);
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Process a user query to find relevant context in Trilium notes
     *
     * @param userQuestion - The user's query
     * @param llmService - The LLM service to use
     * @param options - Context processing options
     * @returns Context information and relevant notes
     */
    async processQuery(
        userQuestion: string,
        llmService: LLMServiceInterface,
        options: ContextOptions = {}
    ): Promise<{
        context: string;
        sources: NoteSearchResult[];
        thinking?: string;
        decomposedQuery?: any;
    }> {
        // Set default options
        const {
            summarizeContent = false,
            maxResults = 10,
            contextNoteId = null,
            useQueryEnhancement = true,
            useQueryDecomposition = false,
            showThinking = false
        } = options;

        log.info(`Processing query: "${userQuestion.substring(0, 50)}..."`);
        log.info(`Options: summarize=${summarizeContent}, maxResults=${maxResults}, contextNoteId=${contextNoteId || 'global'}`);
        log.info(`Processing: enhancement=${useQueryEnhancement}, decomposition=${useQueryDecomposition}, showThinking=${showThinking}`);

        if (!this.initialized) {
            try {
                await this.initialize();
            } catch (error) {
                log.error(`Failed to initialize ContextService: ${error}`);
                // Return a fallback response if initialization fails
                return {
                    context: CONTEXT_PROMPTS.NO_NOTES_CONTEXT,
                    sources: [],
                    thinking: undefined
                };
            }
        }

        try {
            let decomposedQuery;
            let searchQueries: string[] = [userQuestion];
            let relevantNotes: NoteSearchResult[] = [];

            // Step 1: Decompose query if requested
            if (useQueryDecomposition) {
                log.info(`Decomposing query for better understanding`);
                try {
                    // Use the async version with the LLM service
                    decomposedQuery = await queryProcessor.decomposeQuery(userQuestion, undefined, llmService);
                    log.info(`Successfully decomposed query complexity: ${decomposedQuery.complexity}/10 with ${decomposedQuery.subQueries.length} sub-queries`);
                } catch (error) {
                    log.error(`Error in query decomposition, using fallback: ${error}`);
                    // Fallback to simpler decomposition
                    decomposedQuery = {
                        originalQuery: userQuestion,
                        subQueries: [{
                            id: `sq_fallback_${Date.now()}`,
                            text: userQuestion,
                            reason: "Fallback to original query due to decomposition error",
                            isAnswered: false
                        }],
                        status: 'pending',
                        complexity: 1
                    };
                }

                // Extract sub-queries to use for search
                if (decomposedQuery.subQueries.length > 0) {
                    searchQueries = decomposedQuery.subQueries
                        .map(sq => sq.text)
                        .filter(text => text !== userQuestion); // Remove the original query to avoid duplication

                    // Always include the original query
                    searchQueries.unshift(userQuestion);

                    log.info(`Query decomposed into ${searchQueries.length} search queries`);
                }
            }
            // Step 2: Or enhance query if requested
            else if (useQueryEnhancement) {
                try {
                    log.info(`Enhancing query for better semantic matching`);
                    searchQueries = await queryProcessor.generateSearchQueries(userQuestion, llmService);
                    log.info(`Generated ${searchQueries.length} enhanced search queries`);
                } catch (error) {
                    log.error(`Error generating search queries, using fallback: ${error}`);
                    searchQueries = [userQuestion]; // Fallback to using the original question
                }
            }

            // Step 3: Find relevant notes using traditional search
            log.info("Using traditional search for note discovery");

            // Use fallback context based on the context note if provided
            if (contextNoteId) {
                try {
                    const becca = (await import('../../../../becca/becca.js')).default;
                    const contextNote = becca.getNote(contextNoteId);
                    if (contextNote) {
                        const content = await this.contextExtractor.getNoteContent(contextNoteId);
                        relevantNotes = [{
                            noteId: contextNoteId,
                            title: contextNote.title,
                            similarity: 1.0,
                            content: content || ""
                        }];

                        // Add child notes as additional context
                        const childNotes = contextNote.getChildNotes().slice(0, maxResults - 1);
                        for (const child of childNotes) {
                            const childContent = await this.contextExtractor.getNoteContent(child.noteId);
                            relevantNotes.push({
                                noteId: child.noteId,
                                title: child.title,
                                similarity: 0.8,
                                content: childContent || ""
                            });
                        }
                    }
                } catch (error) {
                    log.error(`Error accessing context note: ${error}`);
                }
            }

            log.info(`Final combined results: ${relevantNotes.length} relevant notes`);

            // Step 4: Build context from the notes
            const context = await contextFormatter.buildContextFromNotes(
                relevantNotes,
                userQuestion,
                'default'
            );

            // Step 5: Add agent tools context if requested
            let enhancedContext = context;
            let thinkingProcess: string | undefined = undefined;

            if (showThinking) {
                thinkingProcess = this.generateThinkingProcess(
                    userQuestion,
                    searchQueries,
                    relevantNotes,
                    decomposedQuery
                );
            }

            return {
                context: enhancedContext,
                sources: relevantNotes,
                thinking: thinkingProcess,
                decomposedQuery
            };
        } catch (error) {
            log.error(`Error processing query: ${error}`);
            return {
                context: CONTEXT_PROMPTS.NO_NOTES_CONTEXT,
                sources: [],
                thinking: undefined
            };
        }
    }

    /**
     * Generate a thinking process for debugging and transparency
     */
    private generateThinkingProcess(
        originalQuery: string,
        searchQueries: string[],
        relevantNotes: NoteSearchResult[],
        decomposedQuery?: any
    ): string {
        let thinking = `## Query Processing\n\n`;
        thinking += `Original query: "${originalQuery}"\n\n`;

        // Add decomposition analysis if available
        if (decomposedQuery) {
            thinking += `Query complexity: ${decomposedQuery.complexity}/10\n\n`;
            thinking += `### Decomposed into ${decomposedQuery.subQueries.length} sub-queries:\n`;

            decomposedQuery.subQueries.forEach((sq: any, i: number) => {
                thinking += `${i + 1}. ${sq.text}\n   Reason: ${sq.reason}\n\n`;
            });
        }

        // Add search queries
        thinking += `### Search Queries Used:\n`;
        searchQueries.forEach((q, i) => {
            thinking += `${i + 1}. "${q}"\n`;
        });

        // Add found sources
        thinking += `\n## Sources Retrieved (${relevantNotes.length})\n\n`;

        relevantNotes.slice(0, 5).forEach((note, i) => {
            thinking += `${i + 1}. "${note.title}" (Score: ${Math.round(note.similarity * 100)}%)\n`;
            thinking += `   ID: ${note.noteId}\n`;

            // Check if parentPath exists before using it
            if ('parentPath' in note && note.parentPath) {
                thinking += `   Path: ${note.parentPath}\n`;
            }

            if (note.content) {
                const contentPreview = note.content.length > 100
                    ? note.content.substring(0, 100) + '...'
                    : note.content;
                thinking += `   Preview: ${contentPreview}\n`;
            }

            thinking += '\n';
        });

        if (relevantNotes.length > 5) {
            thinking += `... and ${relevantNotes.length - 5} more sources\n`;
        }

        return thinking;
    }

    /**
     * Find notes semantically related to a query
     * (Shorthand method that directly uses vectorSearchService)
     */
    async findRelevantNotes(
        query: string,
        contextNoteId: string | null = null,
        options: {
            maxResults?: number,
            summarize?: boolean,
            llmService?: LLMServiceInterface | null
        } = {}
    ): Promise<NoteSearchResult[]> {
        // Vector search has been removed - return empty results
        // The LLM will rely on tool calls for context gathering
        log.info(`Vector search disabled - findRelevantNotes returning empty results for query: ${query}`);
        return [];
    }
}

// Export a singleton instance
export default new ContextService();
