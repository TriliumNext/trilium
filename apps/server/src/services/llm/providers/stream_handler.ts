/**
 * Stream Handler - Reusable streaming implementation for LLM providers
 *
 * This module provides common streaming utilities that can be used by any LLM provider.
 * It abstracts the complexities of handling streaming responses and tool executions.
 */

import type { StreamChunk as BaseStreamChunk, ChatCompletionOptions } from '../ai_interface.js';
import log from '../../log.js';

/**
 * Extended StreamChunk interface that makes 'done' optional for internal use
 */
export interface StreamChunk extends Omit<BaseStreamChunk, 'done'> {
    done?: boolean;
}

/**
 * Stream processing options
 */
export interface StreamProcessingOptions {
    streamCallback?: (text: string, done: boolean, chunk?: any) => Promise<void> | void;
    providerName: string;
    modelName: string;
}

/**
 * Helper function to extract content from a chunk based on provider's response format
 * Different providers may have different chunk structures
 */
function getChunkContentProperty(chunk: any): string | null {
    // Check common content locations in different provider responses
    if (chunk.message?.content && typeof chunk.message.content === 'string') {
        return chunk.message.content;
    }
    if (chunk.content && typeof chunk.content === 'string') {
        return chunk.content;
    }
    if (chunk.choices?.[0]?.delta?.content && typeof chunk.choices[0].delta.content === 'string') {
        return chunk.choices[0].delta.content;
    }
    return null;
}

/**
 * Stream processor that handles common streaming operations
 */
export class StreamProcessor {
    /**
     * Process an individual chunk from a streaming response
     */
    static async processChunk(
        chunk: any,
        completeText: string,
        chunkCount: number,
        options: StreamProcessingOptions
    ): Promise<{completeText: string, logged: boolean}> {
        let textToAdd = '';
        let logged = false;

        // Enhanced logging for content chunks and completion status
        if (chunkCount === 1 || chunkCount % 10 === 0 || chunk.done) {
            const contentProp = getChunkContentProperty(chunk);
            log.info(`Processing ${options.providerName} stream chunk #${chunkCount}, done=${!!chunk.done}, has content=${!!contentProp}, content length=${contentProp?.length || 0}`);
            logged = true;
        }

        // Extract content if available using the same logic as getChunkContentProperty
        const contentProperty = getChunkContentProperty(chunk);
        if (contentProperty) {
            textToAdd = contentProperty;
            const newCompleteText = completeText + textToAdd;

            if (chunkCount === 1) {
                // Log the first chunk more verbosely for debugging
                const textStr = String(textToAdd);
                const textPreview = textStr.substring(0, 100);
                log.info(`First content chunk [${contentProperty.length} chars]: "${textPreview}${textStr.length > 100 ? '...' : ''}"`);
            }

            // For final chunks with done=true, log more information
            if (chunk.done) {
                log.info(`Final content chunk received with done=true flag. Length: ${contentProperty.length}`);
            }

            return { completeText: newCompleteText, logged };
        } else if (chunk.done) {
            // If it's the final chunk with no content, log this case
            log.info(`Empty final chunk received with done=true flag`);
        }

        return { completeText, logged };
    }

    /**
     * Send a streaming chunk to the callback
     */
    static async sendChunkToCallback(
        callback: (text: string, done: boolean, chunk?: any) => Promise<void> | void,
        content: string,
        done: boolean,
        chunk: any,
        chunkNumber: number
    ): Promise<void> {
        try {
            // Log all done=true callbacks and first chunk for debugging
            if (done || chunkNumber === 1) {
                log.info(`Sending chunk to callback: chunkNumber=${chunkNumber}, contentLength=${content?.length || 0}, done=${done}`);
            }

            // Always make sure we have a string for content
            const safeContent = content || '';

            const result = callback(safeContent, done, chunk);
            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }

            if (chunkNumber === 1) {
                log.info(`Successfully called streamCallback with first chunk`);
            }

            if (done) {
                log.info(`Successfully called streamCallback with done=true flag`);
            }
        } catch (callbackError) {
            try {
                log.error(`Error in streamCallback: ${callbackError}`);
            } catch (loggingError) {
                // If logging fails, there's not much we can do - just continue
                // We don't want to break the stream processing because of logging issues
            }
            // Note: We don't re-throw callback errors to avoid breaking the stream
        }
    }

    /**
     * Send final completion callback
     */
    static async sendFinalCallback(
        callback: (text: string, done: boolean, chunk?: any) => Promise<void> | void,
        completeText: string
    ): Promise<void> {
        try {
            log.info(`Sending explicit final done=true callback after processing all chunks. Complete text length: ${completeText?.length || 0}`);

            // Pass the complete text instead of empty string for better UX
            // The client will know it's done based on the done=true flag
            const result = callback(completeText || '', true, { done: true, complete: true });

            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }

            log.info(`Final callback sent successfully with done=true flag`);
        } catch (finalCallbackError) {
            try {
                log.error(`Error in final streamCallback: ${finalCallbackError}`);
            } catch (loggingError) {
                // If logging fails, there's not much we can do - just continue
            }
            // Note: We don't re-throw final callback errors to avoid breaking the stream
        }
    }

    /**
     * Detect and extract tool calls from a response chunk
     */
    static extractToolCalls(chunk: any): any[] {
        // Check message.tool_calls first (common format)
        if (chunk.message?.tool_calls &&
            Array.isArray(chunk.message.tool_calls) &&
            chunk.message.tool_calls.length > 0) {

            log.info(`Detected ${chunk.message.tool_calls.length} tool calls in stream chunk`);
            return [...chunk.message.tool_calls];
        }

        // Check OpenAI format: choices[0].delta.tool_calls
        if (chunk.choices?.[0]?.delta?.tool_calls &&
            Array.isArray(chunk.choices[0].delta.tool_calls) &&
            chunk.choices[0].delta.tool_calls.length > 0) {

            log.info(`Detected ${chunk.choices[0].delta.tool_calls.length} OpenAI tool calls in stream chunk`);
            return [...chunk.choices[0].delta.tool_calls];
        }

        return [];
    }

    /**
     * Create a standard response object from streaming results
     */
    static createFinalResponse(
        completeText: string,
        modelName: string,
        providerName: string,
        toolCalls: any[],
        usage: any = {}
    ) {
        return {
            text: completeText,
            model: modelName,
            provider: providerName,
            tool_calls: toolCalls,
            usage
        };
    }
}

/**
 * Create a streaming handler that follows a consistent pattern
 */
export function createStreamHandler(
    options: StreamProcessingOptions,
    processFn: (
        callback: (chunk: StreamChunk) => Promise<void> | void
    ) => Promise<string>
): (callback: (chunk: StreamChunk) => Promise<void> | void) => Promise<string> {
    return async (callback) => {
        let chunkCount = 0;

        try {
            // Run the processor function with our callback
            return await processFn(async (chunk) => {
                chunkCount++;

                // Pass each chunk directly to the callback as it arrives
                // without modifying or accumulating its content
                await callback({
                    text: chunk.text,
                    done: true,
                    tool_calls: chunk.tool_calls,
                    raw: typeof chunk.raw === 'object' ?
                        chunk.raw as Record<string, unknown> :
                        { data: chunk.raw } as Record<string, unknown> // Include raw data
                });
            });
        } catch (error) {
            log.error(`Error in stream handler: ${error}`);
            throw error;
        } finally {
            // Always ensure a final done=true chunk is sent
            if (chunkCount > 0) {
                try {
                    await callback({
                        text: '',
                        done: true
                    });
                } catch (e) {
                    log.error(`Error sending final chunk: ${e}`);
                }
            }
        }
    };
}

/**
 * Interface for provider-specific stream options
 */
export interface ProviderStreamOptions {
    providerName: string;
    modelName: string;
    apiConfig?: any;
}

/**
 * Interface for streaming response stats
 */
export interface StreamStats {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
}

/**
 * Perform a health check against an API endpoint
 * @param checkFn Function that performs the actual health check API call
 * @param providerName Name of the provider for logging
 * @returns Promise resolving to true if healthy, or throwing an error if not
 */
export async function performProviderHealthCheck(
    checkFn: () => Promise<any>,
    providerName: string
): Promise<boolean> {
    try {
        log.info(`Performing ${providerName} health check...`);
        const healthResponse = await checkFn();
        log.info(`${providerName} health check successful`);
        return true;
    } catch (healthError) {
        log.error(`${providerName} health check failed: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
        throw new Error(`Unable to connect to ${providerName} server: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
    }
}

/**
 * Process a stream from an LLM provider using a callback-based approach
 * @param streamIterator Async iterator returned from the provider's API
 * @param options Provider information and configuration
 * @param streamCallback Optional callback function for streaming updates
 * @returns Promise resolving to the complete response including text and tool calls
 */
export async function processProviderStream(
    streamIterator: AsyncIterable<any>,
    options: ProviderStreamOptions,
    streamCallback?: (text: string, done: boolean, chunk?: any) => Promise<void> | void
): Promise<{
    completeText: string;
    toolCalls: any[];
    finalChunk: any | null;
    chunkCount: number;
}> {
    let completeText = '';
    let responseToolCalls: any[] = [];
    let finalChunk: any | null = null;
    let chunkCount = 0;
    let streamComplete = false; // Track if done=true has been received

    try {
        log.info(`Starting ${options.providerName} stream processing with model ${options.modelName}`);

        // Validate stream iterator
        if (!streamIterator || typeof streamIterator[Symbol.asyncIterator] !== 'function') {
            log.error(`Invalid stream iterator returned from ${options.providerName}`);
            throw new Error(`Invalid stream iterator returned from ${options.providerName}`);
        }

        // Process each chunk
        for await (const chunk of streamIterator) {
            // Skip null/undefined chunks to handle malformed responses
            if (chunk === null || chunk === undefined) {
                chunkCount++;
                continue;
            }

            chunkCount++;
            finalChunk = chunk;

            // If we've already received done=true, ignore subsequent chunks but still count them
            if (streamComplete) {
                continue;
            }

            // Process chunk with StreamProcessor
            const result = await StreamProcessor.processChunk(
                chunk,
                completeText,
                chunkCount,
                { providerName: options.providerName, modelName: options.modelName }
            );

            completeText = result.completeText;

            // Extract tool calls
            const toolCalls = StreamProcessor.extractToolCalls(chunk);
            if (toolCalls.length > 0) {
                responseToolCalls = toolCalls;
            }

            // Call the callback with the current chunk content if provided
            if (streamCallback) {
                // For chunks with content, send the content directly
                const contentProperty = getChunkContentProperty(chunk);
                const hasRealContent = contentProperty && contentProperty.trim().length > 0;

                if (hasRealContent) {
                    await StreamProcessor.sendChunkToCallback(
                        streamCallback,
                        contentProperty,
                        !!chunk.done, // Mark as done if done flag is set
                        chunk,
                        chunkCount
                    );
                } else if (chunk.done) {
                    // Send empty done message for final chunk with no content
                    await StreamProcessor.sendChunkToCallback(
                        streamCallback,
                        '',
                        true,
                        chunk,
                        chunkCount
                    );
                } else if (toolCalls.length > 0) {
                    // Send callback for tool-only chunks (no content but has tool calls)
                    await StreamProcessor.sendChunkToCallback(
                        streamCallback,
                        '',
                        !!chunk.done,
                        chunk,
                        chunkCount
                    );
                } else if (chunk.message?.thinking || chunk.thinking) {
                    // Send callback for thinking chunks (Anthropic format)
                    await StreamProcessor.sendChunkToCallback(
                        streamCallback,
                        '',
                        !!chunk.done,
                        chunk,
                        chunkCount
                    );
                }
            }

            // Mark stream as complete if done=true is received
            if (chunk.done) {
                streamComplete = true;
                if (!result.logged) {
                    log.info(`Reached final chunk (done=true) after ${chunkCount} chunks, total content length: ${completeText.length}`);
                }
            }
        }

        // Send one final callback with done=true if the last chunk didn't have done=true
        if (streamCallback && (!finalChunk || !finalChunk.done)) {
            log.info(`Sending explicit final callback with done=true flag after all chunks processed`);
            await StreamProcessor.sendFinalCallback(streamCallback, completeText);
        }

        log.info(`Completed ${options.providerName} streaming: processed ${chunkCount} chunks, final content: ${completeText.length} chars`);

        return {
            completeText,
            toolCalls: responseToolCalls,
            finalChunk,
            chunkCount
        };
    } catch (error) {
        // Improved error handling to preserve original error even if logging fails
        let logError: unknown | null = null;
        try {
            log.error(`Error in ${options.providerName} stream processing: ${error instanceof Error ? error.message : String(error)}`);
            log.error(`Error details: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
        } catch (loggingError) {
            // Store logging error but don't let it override the original error
            logError = loggingError;
        }

        // Always throw the original error, not the logging error
        throw error;
    }
}

/**
 * Extract usage statistics from the final chunk based on provider format
 */
export function extractStreamStats(finalChunk: any | null, providerName: string): StreamStats {
    // Handle provider-specific response formats
    if (!finalChunk) {
        return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }

    // Ollama format - handle partial stats where some fields might be missing
    if (finalChunk.prompt_eval_count !== undefined || finalChunk.eval_count !== undefined) {
        const promptTokens = finalChunk.prompt_eval_count || 0;
        const completionTokens = finalChunk.eval_count || 0;
        return {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens
        };
    }

    // OpenAI-like format
    if (finalChunk.usage) {
        return {
            promptTokens: finalChunk.usage.prompt_tokens || 0,
            completionTokens: finalChunk.usage.completion_tokens || 0,
            totalTokens: finalChunk.usage.total_tokens || 0
        };
    }

    log.info(`No standard token usage found in ${providerName} final chunk`);
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}
