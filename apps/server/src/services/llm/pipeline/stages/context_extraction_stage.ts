import { BasePipelineStage } from '../pipeline_stage.js';
import type { ContextExtractionInput } from '../interfaces.js';
import aiServiceManager from '../../ai_service_manager.js';
import log from '../../../log.js';

/**
 * Context Extraction Pipeline Stage
 */

export interface ContextExtractionOutput {
    context: string;
    noteId: string;
    query: string;
}

/**
 * Pipeline stage for extracting context from notes
 */
export class ContextExtractionStage {
    constructor() {
        log.info('ContextExtractionStage initialized');
    }

    /**
     * Execute the context extraction stage
     */
    async execute(input: ContextExtractionInput): Promise<ContextExtractionOutput> {
        return this.process(input);
    }

    /**
     * Process the input and extract context
     */
    protected async process(input: ContextExtractionInput): Promise<ContextExtractionOutput> {
        const { useSmartContext = true } = input;
        const noteId = input.noteId || 'global';
        const query = input.query || '';

        log.info(`ContextExtractionStage: Extracting context for noteId=${noteId}, query="${query.substring(0, 30)}..."`);

        try {
            let context = '';

            // Get enhanced context from the context service
            const contextService = aiServiceManager.getContextService();
            const llmService = await aiServiceManager.getService();

            if (contextService) {
                // Use unified context service to get smart context
                context = await contextService.processQuery(
                    query,
                    llmService,
                    { contextNoteId: noteId }
                ).then(result => result.context);

                log.info(`ContextExtractionStage: Generated enhanced context (${context.length} chars)`);
            } else {
                log.info('ContextExtractionStage: Context service not available, using default context');
            }

            return {
                context,
                noteId,
                query
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`ContextExtractionStage: Error extracting context: ${errorMessage}`);
            throw error;
        }
    }
}
