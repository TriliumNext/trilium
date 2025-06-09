/**
 * Contains functions for chunking content into smaller pieces for processing
 * These functions are used to properly prepare content for LLM context windows
 */

/**
 * Interface for chunked content
 */
export interface ContentChunk {
    content: string;
    prefix: string;
    noteId?: string;
    title?: string;
    path?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Options for the chunking process
 */
export interface ChunkOptions {
    /**
     * Maximum size of each chunk in characters
     * Defaults to LLM context window size (typically around 2048)
     */
    maxChunkSize?: number;

    /**
     * How much chunks should overlap to maintain context
     */
    overlapSize?: number;

    /**
     * Whether to respect sentence and paragraph boundaries
     */
    respectBoundaries?: boolean;

    /**
     * Whether to add metadata to chunks
     */
    includeMetadata?: boolean;

    /**
     * Additional information to include in chunk metadata
     */
    metadata?: Record<string, unknown>;
}

/**
 * Default options for chunking
 */
async function getDefaultChunkOptions(): Promise<Required<ChunkOptions>> {
    // Import constants directly
    const { LLM_CONSTANTS } = await import('../constants/provider_constants.js');

    return {
        maxChunkSize: LLM_CONSTANTS.CHUNKING.DEFAULT_SIZE,
        overlapSize: LLM_CONSTANTS.CHUNKING.DEFAULT_OVERLAP,
        respectBoundaries: true,
        includeMetadata: true,
        metadata: {}
    };
}

/**
 * Chunk content into smaller pieces
 * Used for processing large documents and preparing them for LLMs
 */
export async function chunkContent(
    content: string,
    title: string = '',
    noteId: string = '',
    options: ChunkOptions = {}
): Promise<ContentChunk[]> {
    // Merge provided options with defaults
    const defaultOptions = await getDefaultChunkOptions();
    const config: Required<ChunkOptions> = { ...defaultOptions, ...options };

    // If content is small enough, return as a single chunk
    if (content.length <= config.maxChunkSize) {
        return [{
            content,
            prefix: title,
            noteId,
            title,
            metadata: config.metadata
        }];
    }

    const chunks: ContentChunk[] = [];

    if (config.respectBoundaries) {
        // Try to split on paragraph boundaries first
        const paragraphs = content.split(/\n\s*\n/);

        let currentChunk = '';
        let currentPrefix = title ? title : '';

        for (const paragraph of paragraphs) {
            // If adding this paragraph would exceed max size, create a new chunk
            if (currentChunk.length + paragraph.length > config.maxChunkSize) {
                // If current chunk is not empty, add it to chunks
                if (currentChunk.length > 0) {
                    chunks.push({
                        content: currentChunk,
                        prefix: currentPrefix,
                        noteId,
                        title,
                        metadata: config.metadata
                    });
                }

                // Start a new chunk, use the overlap if possible
                if (config.overlapSize > 0 && currentChunk.length > 0) {
                    // For overlap, take the last N characters
                    const overlapText = currentChunk.slice(-config.overlapSize);
                    currentChunk = overlapText + paragraph;
                    currentPrefix = `${title} (continued)`;
                } else {
                    currentChunk = paragraph;
                    currentPrefix = `${title} (continued)`;
                }
            } else {
                // Add paragraph to current chunk
                if (currentChunk.length > 0) {
                    currentChunk += '\n\n';
                }
                currentChunk += paragraph;
            }
        }

        // Add the last chunk if it's not empty
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk,
                prefix: currentPrefix,
                noteId,
                title,
                metadata: config.metadata
            });
        }
    } else {
        // Simple chunking by character count
        let currentPosition = 0;

        while (currentPosition < content.length) {
            const chunkEnd = Math.min(currentPosition + config.maxChunkSize, content.length);

            const chunk = content.substring(currentPosition, chunkEnd);
            const prefix = currentPosition === 0 ? title : `${title} (continued)`;

            chunks.push({
                content: chunk,
                prefix,
                noteId,
                title,
                metadata: config.metadata
            });

            // Move position, considering overlap
            currentPosition = chunkEnd - (config.overlapSize || 0);

            // Prevent infinite loop if overlap is too large
            if (currentPosition <= 0 || currentPosition >= content.length) {
                break;
            }
        }
    }

    return chunks;
}

/**
 * Smarter chunking that tries to respect semantic boundaries like headers and sections
 */
export async function semanticChunking(
    content: string,
    title: string = '',
    noteId: string = '',
    options: ChunkOptions = {}
): Promise<ContentChunk[]> {
    // Merge provided options with defaults
    const defaultOptions = await getDefaultChunkOptions();
    const config: Required<ChunkOptions> = { ...defaultOptions, ...options };

    // If content is small enough, return as a single chunk
    if (content.length <= config.maxChunkSize) {
        return [{
            content,
            prefix: title,
            noteId,
            title,
            metadata: config.metadata
        }];
    }

    const chunks: ContentChunk[] = [];

    // Try to split on headers first
    const headerPattern = /#{1,6}\s+.+|<h[1-6][^>]*>.*?<\/h[1-6]>/g;
    const sections: string[] = [];

    let lastIndex = 0;
    let match;

    // First, find all headers and split content into sections
    while ((match = headerPattern.exec(content)) !== null) {
        if (match.index > lastIndex) {
            // Add the content before this header
            sections.push(content.substring(lastIndex, match.index));
        }

        // Start a new section with this header
        lastIndex = match.index;
    }

    // Add the last section
    if (lastIndex < content.length) {
        sections.push(content.substring(lastIndex));
    }

    // If no headers were found, fall back to regular chunking
    if (sections.length <= 1) {
        return await chunkContent(content, title, noteId, options);
    }

    // Process each section
    let currentChunk = '';
    let currentPrefix = title;

    for (const section of sections) {
        // If adding this section would exceed max size, create a new chunk
        if (currentChunk.length + section.length > config.maxChunkSize) {
            // If this single section is too big, it needs to be chunked further
            if (section.length > config.maxChunkSize) {
                // First add the current chunk if not empty
                if (currentChunk.length > 0) {
                    chunks.push({
                        content: currentChunk,
                        prefix: currentPrefix,
                        noteId,
                        title,
                        metadata: config.metadata
                    });
                }

                // Chunk this section separately
                const sectionChunks = await chunkContent(
                    section,
                    title,
                    noteId,
                    options
                );

                chunks.push(...sectionChunks);

                // Reset current chunk
                currentChunk = '';
                currentPrefix = `${title} (continued)`;
            } else {
                // Add current chunk to chunks
                chunks.push({
                    content: currentChunk,
                    prefix: currentPrefix,
                    noteId,
                    title,
                    metadata: config.metadata
                });

                // Start a new chunk with this section
                currentChunk = section;
                currentPrefix = `${title} (continued)`;
            }
        } else {
            // Add section to current chunk
            if (currentChunk.length > 0 && !currentChunk.endsWith('\n')) {
                currentChunk += '\n\n';
            }
            currentChunk += section;
        }
    }

    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk,
            prefix: currentPrefix,
            noteId,
            title,
            metadata: config.metadata
        });
    }

    return chunks;
}

export interface NoteChunk {
    noteId: string;
    title: string;
    content: string;
    type?: string;
    metadata?: Record<string, unknown>;
}
