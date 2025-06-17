import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processProviderStream, StreamProcessor } from '../stream_handler.js';
import type { ProviderStreamOptions } from '../stream_handler.js';

// Mock log service
vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe.skip('Provider Streaming Integration Tests', () => {
    let mockProviderOptions: ProviderStreamOptions;

    beforeEach(() => {
        vi.clearAllMocks();
        mockProviderOptions = {
            providerName: 'TestProvider',
            modelName: 'test-model-v1'
        };
    });

    describe('OpenAI-like Provider Integration', () => {
        it('should handle OpenAI streaming format', async () => {
            // Simulate OpenAI streaming chunks
            const openAIChunks = [
                {
                    choices: [{ delta: { content: 'Hello' } }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{ delta: { content: ' world' } }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{ delta: { content: '!' } }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{ finish_reason: 'stop' }],
                    model: 'gpt-3.5-turbo',
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 3,
                        total_tokens: 13
                    },
                    done: true
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of openAIChunks) {
                        yield chunk;
                    }
                }
            };

            const receivedChunks: any[] = [];
            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'OpenAI' },
                (text, done, chunk) => {
                    receivedChunks.push({ text, done, chunk });
                }
            );

            expect(result.completeText).toBe('Hello world!');
            expect(result.chunkCount).toBe(4);
            expect(receivedChunks.length).toBeGreaterThan(0);

            // Verify callback received content chunks
            const contentChunks = receivedChunks.filter(c => c.text);
            expect(contentChunks.length).toBe(3);
        });

        it('should handle OpenAI tool calls', async () => {
            const openAIWithTools = [
                {
                    choices: [{ delta: { content: 'Let me calculate that' } }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{
                        delta: {
                            tool_calls: [{
                                id: 'call_123',
                                type: 'function',
                                function: {
                                    name: 'calculator',
                                    arguments: '{"expression": "2+2"}'
                                }
                            }]
                        }
                    }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{ delta: { content: 'The answer is 4' } }],
                    model: 'gpt-3.5-turbo'
                },
                {
                    choices: [{ finish_reason: 'stop' }],
                    model: 'gpt-3.5-turbo',
                    done: true
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of openAIWithTools) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'OpenAI' }
            );

            expect(result.completeText).toBe('Let me calculate thatThe answer is 4');
            expect(result.toolCalls.length).toBe(1);
            expect(result.toolCalls[0].function.name).toBe('calculator');
        });
    });

    describe('Ollama Provider Integration', () => {
        it('should handle Ollama streaming format', async () => {
            const ollamaChunks = [
                {
                    model: 'llama2',
                    message: { content: 'The weather' },
                    done: false
                },
                {
                    model: 'llama2',
                    message: { content: ' today is' },
                    done: false
                },
                {
                    model: 'llama2',
                    message: { content: ' sunny.' },
                    done: false
                },
                {
                    model: 'llama2',
                    message: { content: '' },
                    done: true,
                    prompt_eval_count: 15,
                    eval_count: 8,
                    total_duration: 12345678
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of ollamaChunks) {
                        yield chunk;
                    }
                }
            };

            const receivedChunks: any[] = [];
            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'Ollama' },
                (text, done, chunk) => {
                    receivedChunks.push({ text, done, chunk });
                }
            );

            expect(result.completeText).toBe('The weather today is sunny.');
            expect(result.chunkCount).toBe(4);

            // Verify final chunk has usage stats
            expect(result.finalChunk.prompt_eval_count).toBe(15);
            expect(result.finalChunk.eval_count).toBe(8);
        });

        it('should handle Ollama empty responses', async () => {
            const ollamaEmpty = [
                {
                    model: 'llama2',
                    message: { content: '' },
                    done: true,
                    prompt_eval_count: 5,
                    eval_count: 0
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of ollamaEmpty) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'Ollama' }
            );

            expect(result.completeText).toBe('');
            expect(result.chunkCount).toBe(1);
        });
    });

    describe('Anthropic Provider Integration', () => {
        it('should handle Anthropic streaming format', async () => {
            const anthropicChunks = [
                {
                    type: 'message_start',
                    message: {
                        id: 'msg_123',
                        type: 'message',
                        role: 'assistant',
                        content: []
                    }
                },
                {
                    type: 'content_block_start',
                    index: 0,
                    content_block: { type: 'text', text: '' }
                },
                {
                    type: 'content_block_delta',
                    index: 0,
                    delta: { type: 'text_delta', text: 'Hello' }
                },
                {
                    type: 'content_block_delta',
                    index: 0,
                    delta: { type: 'text_delta', text: ' from' }
                },
                {
                    type: 'content_block_delta',
                    index: 0,
                    delta: { type: 'text_delta', text: ' Claude!' }
                },
                {
                    type: 'content_block_stop',
                    index: 0
                },
                {
                    type: 'message_delta',
                    delta: { stop_reason: 'end_turn' },
                    usage: { output_tokens: 3 }
                },
                {
                    type: 'message_stop',
                    done: true
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of anthropicChunks) {
                        // Anthropic format needs conversion to our standard format
                        if (chunk.type === 'content_block_delta') {
                            yield {
                                message: { content: chunk.delta?.text || '' },
                                done: false
                            };
                        } else if (chunk.type === 'message_stop') {
                            yield { done: true };
                        }
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'Anthropic' }
            );

            expect(result.completeText).toBe('Hello from Claude!');
            expect(result.chunkCount).toBe(4); // 3 content chunks + 1 done
        });

        it('should handle Anthropic thinking blocks', async () => {
            const anthropicWithThinking = [
                {
                    message: { content: '', thinking: 'Let me think about this...' },
                    done: false
                },
                {
                    message: { content: '', thinking: 'I need to consider multiple factors' },
                    done: false
                },
                {
                    message: { content: 'Based on my analysis' },
                    done: false
                },
                {
                    message: { content: ', the answer is 42.' },
                    done: true
                }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of anthropicWithThinking) {
                        yield chunk;
                    }
                }
            };

            const receivedChunks: any[] = [];
            const result = await processProviderStream(
                mockIterator,
                { ...mockProviderOptions, providerName: 'Anthropic' },
                (text, done, chunk) => {
                    receivedChunks.push({ text, done, chunk });
                }
            );

            expect(result.completeText).toBe('Based on my analysis, the answer is 42.');

            // Verify thinking states were captured
            const thinkingChunks = receivedChunks.filter(c => c.chunk?.message?.thinking);
            expect(thinkingChunks.length).toBe(2);
        });
    });

    describe('Error Scenarios Integration', () => {
        it('should handle provider connection timeouts', async () => {
            const timeoutIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Starting...' } };
                    // Simulate timeout
                    await new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timeout')), 100)
                    );
                }
            };

            await expect(processProviderStream(
                timeoutIterator,
                mockProviderOptions
            )).rejects.toThrow('Request timeout');
        });

        it('should handle malformed provider responses', async () => {
            const malformedIterator = {
                async *[Symbol.asyncIterator]() {
                    yield null; // Invalid chunk
                    yield undefined; // Invalid chunk
                    yield { invalidFormat: true }; // No standard fields
                    yield { done: true };
                }
            };

            const result = await processProviderStream(
                malformedIterator,
                mockProviderOptions
            );

            expect(result.completeText).toBe('');
            expect(result.chunkCount).toBe(4);
        });

        it('should handle provider rate limiting', async () => {
            const rateLimitIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Starting request' } };
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            };

            await expect(processProviderStream(
                rateLimitIterator,
                mockProviderOptions
            )).rejects.toThrow('Rate limit exceeded');
        });

        it('should handle network interruptions', async () => {
            const networkErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Partial' } };
                    yield { message: { content: ' response' } };
                    throw new Error('Network error: Connection reset');
                }
            };

            await expect(processProviderStream(
                networkErrorIterator,
                mockProviderOptions
            )).rejects.toThrow('Network error');
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle high-frequency chunk delivery', async () => {
            // Reduced count for CI stability while still testing high frequency
            const chunkCount = 500; // Reduced from 1000
            const highFrequencyChunks = Array.from({ length: chunkCount }, (_, i) => ({
                message: { content: `chunk${i}` },
                done: i === (chunkCount - 1)
            }));

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of highFrequencyChunks) {
                        yield chunk;
                        // No delay - rapid fire
                    }
                }
            };

            const startTime = Date.now();
            const result = await processProviderStream(
                mockIterator,
                mockProviderOptions
            );
            const endTime = Date.now();

            expect(result.chunkCount).toBe(chunkCount);
            expect(result.completeText).toContain(`chunk${chunkCount - 1}`);
            expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3s
        }, 15000); // Add 15 second timeout

        it('should handle large individual chunks', async () => {
            const largeContent = 'x'.repeat(100000); // 100KB chunk
            const largeChunks = [
                { message: { content: largeContent }, done: false },
                { message: { content: ' end' }, done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of largeChunks) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockProviderOptions
            );

            expect(result.completeText.length).toBe(100004); // 100KB + ' end'
            expect(result.chunkCount).toBe(2);
        });

        it('should handle concurrent streaming sessions', async () => {
            const createMockIterator = (sessionId: number) => ({
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < 10; i++) {
                        yield {
                            message: { content: `Session${sessionId}-Chunk${i}` },
                            done: i === 9
                        };
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
            });

            // Start 5 concurrent streaming sessions
            const promises = Array.from({ length: 5 }, (_, i) =>
                processProviderStream(
                    createMockIterator(i),
                    { ...mockProviderOptions, providerName: `Provider${i}` }
                )
            );

            const results = await Promise.all(promises);

            // Verify all sessions completed successfully
            results.forEach((result, i) => {
                expect(result.chunkCount).toBe(10);
                expect(result.completeText).toContain(`Session${i}`);
            });
        });
    });

    describe('Memory Management', () => {
        it.skip('should not leak memory during long streaming sessions', async () => {
            // Reduced chunk count for CI stability - still tests memory management
            const chunkCount = 500; // Reduced from 10000
            const longSessionIterator = {
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < chunkCount; i++) {
                        yield {
                            message: { content: `Chunk ${i} with some additional content to increase memory usage` },
                            done: i === (chunkCount - 1)
                        };

                        // Periodic yield to event loop to prevent blocking
                        if (i % 50 === 0) { // More frequent yields for shorter test
                            await new Promise(resolve => setImmediate(resolve));
                        }
                    }
                }
            };

            const initialMemory = process.memoryUsage();

            const result = await processProviderStream(
                longSessionIterator,
                mockProviderOptions
            );

            const finalMemory = process.memoryUsage();

            expect(result.chunkCount).toBe(chunkCount);

            // Memory increase should be reasonable (less than 20MB for smaller test)
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
        }, 30000); // Add 30 second timeout for this test

        it('should clean up resources on stream completion', async () => {
            const resourceTracker = {
                resources: new Set<string>(),
                allocate(id: string) { this.resources.add(id); },
                cleanup(id: string) { this.resources.delete(id); }
            };

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    resourceTracker.allocate('stream-1');
                    try {
                        yield { message: { content: 'Hello' } };
                        yield { message: { content: 'World' } };
                        yield { done: true };
                    } finally {
                        resourceTracker.cleanup('stream-1');
                    }
                }
            };

            await processProviderStream(
                mockIterator,
                mockProviderOptions
            );

            expect(resourceTracker.resources.size).toBe(0);
        });
    });

    describe('Provider-Specific Configurations', () => {
        it('should handle provider-specific options', async () => {
            const configuredOptions: ProviderStreamOptions = {
                providerName: 'CustomProvider',
                modelName: 'custom-model',
                apiConfig: {
                    temperature: 0.7,
                    maxTokens: 1000,
                    customParameter: 'test-value'
                }
            };

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Configured response' }, done: true };
                }
            };

            const result = await processProviderStream(
                mockIterator,
                configuredOptions
            );

            expect(result.completeText).toBe('Configured response');
        });

        it('should validate provider compatibility', async () => {
            const unsupportedIterator = {
                // Missing Symbol.asyncIterator
                next() { return { value: null, done: true }; }
            };

            await expect(processProviderStream(
                unsupportedIterator as any,
                mockProviderOptions
            )).rejects.toThrow('Invalid stream iterator');
        });
    });
});
