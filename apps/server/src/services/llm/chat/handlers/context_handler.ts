/**
 * Handler for LLM context management
 * Uses TriliumNext's native search service for powerful note discovery
 */
import log from "../../../log.js";
import becca from "../../../../becca/becca.js";
import contextService from "../../context/services/context_service.js";
import searchService from "../../../search/services/search.js";
import type { NoteSource } from "../../interfaces/chat_session.js";

/**
 * Handles context management for LLM chat
 */
export class ContextHandler {
    /**
     * Find relevant notes based on search query using TriliumNext's search service
     * @param content The search content
     * @param contextNoteId Optional note ID for context
     * @param limit Maximum number of results to return
     * @returns Array of relevant note sources
     */
    static async findRelevantNotes(content: string, contextNoteId: string | null = null, limit = 5): Promise<NoteSource[]> {
        try {
            // If content is too short, don't bother
            if (content.length < 3) {
                return [];
            }

            log.info(`Finding relevant notes for query: "${content.substring(0, 50)}..." using TriliumNext search`);

            const sources: NoteSource[] = [];

            if (contextNoteId) {
                // For branch context, get notes specifically from that branch and related notes
                const contextNote = becca.notes[contextNoteId];
                if (!contextNote) {
                    return [];
                }

                const relevantNotes = this.findNotesInContext(contextNote, content, limit);
                sources.push(...relevantNotes);
            } else {
                // General search across all notes using TriliumNext's search service
                const relevantNotes = this.findNotesBySearch(content, limit);
                sources.push(...relevantNotes);
            }

            log.info(`Found ${sources.length} relevant notes using TriliumNext search`);
            return sources.slice(0, limit);
        } catch (error: any) {
            log.error(`Error finding relevant notes: ${error.message}`);
            return [];
        }
    }

    /**
     * Find notes in the context of a specific note (children, siblings, linked notes)
     */
    private static findNotesInContext(contextNote: any, searchQuery: string, limit: number): NoteSource[] {
        const sources: NoteSource[] = [];
        const processedNoteIds = new Set<string>();

        // Add the context note itself (high priority)
        sources.push(this.createNoteSource(contextNote, 1.0));
        processedNoteIds.add(contextNote.noteId);

        // Get child notes (search within children)
        try {
            const childQuery = `note.childOf.noteId = "${contextNote.noteId}" ${searchQuery}`;
            const childSearchResults = searchService.searchNotes(childQuery, { includeArchivedNotes: false });
            
            for (const childNote of childSearchResults.slice(0, Math.floor(limit / 2))) {
                if (!processedNoteIds.has(childNote.noteId)) {
                    sources.push(this.createNoteSource(childNote, 0.8));
                    processedNoteIds.add(childNote.noteId);
                }
            }
        } catch (error) {
            log.info(`Child search failed, falling back to direct children: ${error}`);
            // Fallback to direct child enumeration
            const childNotes = contextNote.getChildNotes();
            for (const child of childNotes.slice(0, Math.floor(limit / 2))) {
                if (!processedNoteIds.has(child.noteId) && !child.isDeleted) {
                    sources.push(this.createNoteSource(child, 0.8));
                    processedNoteIds.add(child.noteId);
                }
            }
        }

        // Get related notes (through relations)
        const relatedNotes = this.getRelatedNotes(contextNote);
        for (const related of relatedNotes.slice(0, Math.floor(limit / 2))) {
            if (!processedNoteIds.has(related.noteId) && !related.isDeleted) {
                sources.push(this.createNoteSource(related, 0.6));
                processedNoteIds.add(related.noteId);
            }
        }

        // Fill remaining slots with broader search if needed
        if (sources.length < limit) {
            try {
                const remainingSlots = limit - sources.length;
                const broadSearchResults = searchService.searchNotes(searchQuery, { 
                    includeArchivedNotes: false,
                    limit: remainingSlots * 2 // Get more to filter out duplicates
                });
                
                for (const note of broadSearchResults.slice(0, remainingSlots)) {
                    if (!processedNoteIds.has(note.noteId)) {
                        sources.push(this.createNoteSource(note, 0.5));
                        processedNoteIds.add(note.noteId);
                    }
                }
            } catch (error) {
                log.error(`Broad search failed: ${error}`);
            }
        }

        return sources.slice(0, limit);
    }

    /**
     * Find notes by search across all notes using TriliumNext's search service
     */
    private static findNotesBySearch(searchQuery: string, limit: number): NoteSource[] {
        try {
            log.info(`Performing global search for: "${searchQuery}"`);
            
            // Use TriliumNext's search service for powerful note discovery
            const searchResults = searchService.searchNotes(searchQuery, { 
                includeArchivedNotes: false,
                fastSearch: false // Use full search for better results
            });

            log.info(`Global search found ${searchResults.length} notes`);

            // Convert search results to NoteSource format
            const sources: NoteSource[] = [];
            const limitedResults = searchResults.slice(0, limit);
            
            for (let i = 0; i < limitedResults.length; i++) {
                const note = limitedResults[i];
                // Calculate similarity score based on position (first results are more relevant)
                const similarity = Math.max(0.1, 1.0 - (i / limitedResults.length) * 0.8);
                sources.push(this.createNoteSource(note, similarity));
            }

            return sources;
        } catch (error) {
            log.error(`Error in global search: ${error}`);
            // Fallback to empty results rather than crashing
            return [];
        }
    }


    /**
     * Get notes related through attributes/relations
     */
    private static getRelatedNotes(note: any): any[] {
        const relatedNotes: any[] = [];
        
        // Get notes this note points to via relations
        const outgoingRelations = note.getOwnedAttributes().filter((attr: any) => attr.type === 'relation');
        for (const relation of outgoingRelations) {
            const targetNote = becca.notes[relation.value];
            if (targetNote && !targetNote.isDeleted) {
                relatedNotes.push(targetNote);
            }
        }

        // Get notes that point to this note via relations
        const incomingRelations = note.getTargetRelations();
        for (const relation of incomingRelations) {
            const sourceNote = relation.getNote();
            if (sourceNote && !sourceNote.isDeleted) {
                relatedNotes.push(sourceNote);
            }
        }

        return relatedNotes;
    }

    /**
     * Create a NoteSource object from a note
     */
    private static createNoteSource(note: any, similarity: number): NoteSource {
        let noteContent: string | undefined = undefined;
        if (note.type === 'text') {
            const content = note.getContent();
            // Handle both string and Buffer types
            noteContent = typeof content === 'string' ? content :
                content instanceof Buffer ? content.toString('utf8') : undefined;
        }

        return {
            noteId: note.noteId,
            title: note.title,
            content: noteContent,
            similarity: similarity,
            branchId: note.getBranches()[0]?.branchId
        };
    }

    /**
     * Process enhanced context using the context service
     * @param query Query to process
     * @param contextNoteId Optional note ID for context
     * @param showThinking Whether to show thinking process
     */
    static async processEnhancedContext(query: string, llmService: any, options: {
        contextNoteId?: string,
        showThinking?: boolean
    }) {
        // Use the Trilium-specific approach
        const contextNoteId = options.contextNoteId || null;
        const showThinking = options.showThinking || false;

        // Log that we're calling contextService with the parameters
        log.info(`Using enhanced context with: noteId=${contextNoteId}, showThinking=${showThinking}`);

        // Call context service for processing
        const results = await contextService.processQuery(
            query,
            llmService,
            {
                contextNoteId,
                showThinking
            }
        );

        // Return the generated context and sources
        return {
            context: results.context,
            sources: results.sources.map(source => ({
                noteId: source.noteId,
                title: source.title,
                content: source.content || undefined, // Convert null to undefined
                similarity: source.similarity
            }))
        };
    }
}