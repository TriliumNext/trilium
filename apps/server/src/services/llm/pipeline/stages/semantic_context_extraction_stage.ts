import { BasePipelineStage } from '../pipeline_stage.js';
import type { SemanticContextExtractionInput } from '../interfaces.js';
import log from '../../../log.js';

/**
 * Pipeline stage for extracting semantic context from notes
 * Since vector search has been removed, this now returns empty context
 * and relies on other context extraction methods
 */
export class SemanticContextExtractionStage extends BasePipelineStage<SemanticContextExtractionInput, { context: string }> {
    constructor() {
        super('SemanticContextExtraction');
    }

    /**
     * Extract semantic context based on a query
     * Returns empty context since vector search has been removed
     */
    protected async process(input: SemanticContextExtractionInput): Promise<{ context: string }> {
        const { noteId, query } = input;
        log.info(`Semantic context extraction disabled - vector search has been removed. Using tool-based context instead for note ${noteId}`);

        // Return empty context since we no longer use vector search
        // The LLM will rely on tool calls for context gathering
        return { context: "" };
    }
}