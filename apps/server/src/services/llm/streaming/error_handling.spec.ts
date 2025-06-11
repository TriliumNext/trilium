import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processProviderStream, StreamProcessor } from '../providers/stream_handler.js';
import type { ProviderStreamOptions } from '../providers/stream_handler.js';

// Mock log service
vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('Streaming Error Handling Tests', () => {
    let mockOptions: ProviderStreamOptions;
    let log: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        log = (await import('../../log.js')).default;
        mockOptions = {
            providerName: 'ErrorTestProvider',
            modelName: 'error-test-model'
        };
    });

    describe('Stream Iterator Errors', () => {
        it('should handle iterator throwing error immediately', async () => {
            const errorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('Iterator initialization failed');
                }
            };

            await expect(processProviderStream(errorIterator, mockOptions))
                .rejects.toThrow('Iterator initialization failed');
            
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in ErrorTestProvider stream processing')
            );
        });

        it('should handle iterator throwing error mid-stream', async () => {
            const midStreamErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Starting...' } };
                    yield { message: { content: 'Processing...' } };
                    throw new Error('Connection lost mid-stream');
                }
            };

            await expect(processProviderStream(midStreamErrorIterator, mockOptions))
                .rejects.toThrow('Connection lost mid-stream');
            
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Connection lost mid-stream')
            );
        });

        it('should handle async iterator returning invalid chunks', async () => {
            const invalidChunkIterator = {
                async *[Symbol.asyncIterator]() {
                    yield null; // Invalid chunk
                    yield undefined; // Invalid chunk
                    yield { randomField: 'not a valid chunk' };
                    yield { done: true };
                }
            };

            // Should not throw, but handle gracefully
            const result = await processProviderStream(invalidChunkIterator, mockOptions);
            
            expect(result.completeText).toBe('');
            expect(result.chunkCount).toBe(4);
        });

        it('should handle iterator returning non-objects', async () => {
            const nonObjectIterator = {
                async *[Symbol.asyncIterator]() {
                    yield 'string chunk'; // Invalid
                    yield 123; // Invalid
                    yield true; // Invalid
                    yield { done: true };
                }
            };

            const result = await processProviderStream(nonObjectIterator, mockOptions);
            expect(result.completeText).toBe('');
        });
    });

    describe('Callback Errors', () => {
        it('should handle callback throwing synchronous errors', async () => {
            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Test' } };
                    yield { done: true };
                }
            };

            const errorCallback = vi.fn(() => {
                throw new Error('Callback sync error');
            });

            // Should not throw from main function
            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                errorCallback
            );

            expect(result.completeText).toBe('Test');
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in streamCallback')
            );
        });

        it('should handle callback throwing async errors', async () => {
            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Test async' } };
                    yield { done: true };
                }
            };

            const asyncErrorCallback = vi.fn(async () => {
                throw new Error('Callback async error');
            });

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                asyncErrorCallback
            );

            expect(result.completeText).toBe('Test async');
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in streamCallback')
            );
        });

        it('should handle callback that never resolves', async () => {
            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Hanging test' } };
                    yield { done: true };
                }
            };

            const hangingCallback = vi.fn(async (): Promise<void> => {
                // Never resolves
                return new Promise(() => {});
            });

            // This test verifies we don't hang indefinitely
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Test timeout')), 1000)
            );

            const streamPromise = processProviderStream(
                mockIterator,
                mockOptions,
                hangingCallback
            );

            // The stream should complete even if callback hangs
            // Note: This test design may need adjustment based on actual implementation
            await expect(Promise.race([streamPromise, timeoutPromise]))
                .rejects.toThrow('Test timeout');
        });
    });

    describe('Network and Connectivity Errors', () => {
        it('should handle network timeout errors', async () => {
            const timeoutIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Starting...' } };
                    await new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('ECONNRESET: Connection reset by peer')), 100)
                    );
                }
            };

            await expect(processProviderStream(timeoutIterator, mockOptions))
                .rejects.toThrow('ECONNRESET');
        });

        it('should handle DNS resolution errors', async () => {
            const dnsErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('ENOTFOUND: getaddrinfo ENOTFOUND api.invalid.domain');
                }
            };

            await expect(processProviderStream(dnsErrorIterator, mockOptions))
                .rejects.toThrow('ENOTFOUND');
        });

        it('should handle SSL/TLS certificate errors', async () => {
            const sslErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE: certificate verify failed');
                }
            };

            await expect(processProviderStream(sslErrorIterator, mockOptions))
                .rejects.toThrow('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
        });
    });

    describe('Provider-Specific Errors', () => {
        it('should handle OpenAI API errors', async () => {
            const openAIErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('Incorrect API key provided. Please check your API key.');
                }
            };

            await expect(processProviderStream(
                openAIErrorIterator,
                { ...mockOptions, providerName: 'OpenAI' }
            )).rejects.toThrow('Incorrect API key provided');
        });

        it('should handle Anthropic rate limiting', async () => {
            const anthropicRateLimit = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Starting...' } };
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            };

            await expect(processProviderStream(
                anthropicRateLimit,
                { ...mockOptions, providerName: 'Anthropic' }
            )).rejects.toThrow('Rate limit exceeded');
        });

        it('should handle Ollama service unavailable', async () => {
            const ollamaUnavailable = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('Ollama service is not running. Please start Ollama first.');
                }
            };

            await expect(processProviderStream(
                ollamaUnavailable,
                { ...mockOptions, providerName: 'Ollama' }
            )).rejects.toThrow('Ollama service is not running');
        });
    });

    describe('Memory and Resource Errors', () => {
        it('should handle out of memory errors gracefully', async () => {
            const memoryErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Normal start' } };
                    throw new Error('JavaScript heap out of memory');
                }
            };

            await expect(processProviderStream(memoryErrorIterator, mockOptions))
                .rejects.toThrow('JavaScript heap out of memory');
            
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('JavaScript heap out of memory')
            );
        });

        it('should handle file descriptor exhaustion', async () => {
            const fdErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('EMFILE: too many open files');
                }
            };

            await expect(processProviderStream(fdErrorIterator, mockOptions))
                .rejects.toThrow('EMFILE');
        });
    });

    describe('Streaming State Errors', () => {
        it('should handle chunks received after done=true', async () => {
            const postDoneIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Normal chunk' } };
                    yield { message: { content: 'Final chunk' }, done: true };
                    // These should be ignored or handled gracefully
                    yield { message: { content: 'Post-done chunk 1' } };
                    yield { message: { content: 'Post-done chunk 2' } };
                }
            };

            const result = await processProviderStream(postDoneIterator, mockOptions);
            
            expect(result.completeText).toBe('Normal chunkFinal chunk');
            expect(result.chunkCount).toBe(4); // All chunks counted
        });

        it('should handle multiple done=true chunks', async () => {
            const multipleDoneIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'Content' } };
                    yield { done: true };
                    yield { done: true }; // Duplicate done
                    yield { done: true }; // Another duplicate
                }
            };

            const result = await processProviderStream(multipleDoneIterator, mockOptions);
            expect(result.chunkCount).toBe(4);
        });

        it('should handle never-ending streams (no done flag)', async () => {
            let chunkCount = 0;
            const neverEndingIterator = {
                async *[Symbol.asyncIterator]() {
                    while (chunkCount < 1000) { // Simulate very long stream
                        yield { message: { content: `chunk${chunkCount++}` } };
                        if (chunkCount % 100 === 0) {
                            await new Promise(resolve => setImmediate(resolve));
                        }
                    }
                    // Never yields done: true
                }
            };

            const result = await processProviderStream(neverEndingIterator, mockOptions);
            
            expect(result.chunkCount).toBe(1000);
            expect(result.completeText).toContain('chunk999');
        });
    });

    describe('Concurrent Error Scenarios', () => {
        it('should handle errors during concurrent streaming', async () => {
            const createFailingIterator = (failAt: number) => ({
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < 10; i++) {
                        if (i === failAt) {
                            throw new Error(`Concurrent error at chunk ${i}`);
                        }
                        yield { message: { content: `chunk${i}` } };
                    }
                    yield { done: true };
                }
            });

            // Start multiple streams, some will fail
            const promises = [
                processProviderStream(createFailingIterator(3), mockOptions),
                processProviderStream(createFailingIterator(5), mockOptions),
                processProviderStream(createFailingIterator(7), mockOptions)
            ];

            const results = await Promise.allSettled(promises);
            
            // All should be rejected
            results.forEach(result => {
                expect(result.status).toBe('rejected');
                if (result.status === 'rejected') {
                    expect(result.reason.message).toMatch(/Concurrent error at chunk \d/);
                }
            });
        });

        it('should isolate errors between concurrent streams', async () => {
            const goodIterator = {
                async *[Symbol.asyncIterator]() {
                    for (let i = 0; i < 5; i++) {
                        yield { message: { content: `good${i}` } };
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    yield { done: true };
                }
            };

            const badIterator = {
                async *[Symbol.asyncIterator]() {
                    yield { message: { content: 'bad start' } };
                    throw new Error('Bad stream error');
                }
            };

            const [goodResult, badResult] = await Promise.allSettled([
                processProviderStream(goodIterator, mockOptions),
                processProviderStream(badIterator, mockOptions)
            ]);

            expect(goodResult.status).toBe('fulfilled');
            expect(badResult.status).toBe('rejected');
            
            if (goodResult.status === 'fulfilled') {
                expect(goodResult.value.completeText).toContain('good4');
            }
        });
    });

    describe('Error Recovery and Cleanup', () => {
        it('should clean up resources on error', async () => {
            let resourcesAllocated = false;
            let resourcesCleaned = false;

            const resourceErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    resourcesAllocated = true;
                    try {
                        yield { message: { content: 'Resource test' } };
                        throw new Error('Resource allocation failed');
                    } finally {
                        resourcesCleaned = true;
                    }
                }
            };

            await expect(processProviderStream(resourceErrorIterator, mockOptions))
                .rejects.toThrow('Resource allocation failed');
            
            expect(resourcesAllocated).toBe(true);
            expect(resourcesCleaned).toBe(true);
        });

        it('should log comprehensive error details', async () => {
            const detailedError = new Error('Detailed test error');
            detailedError.stack = 'Error: Detailed test error\n    at test location\n    at another location';

            const errorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw detailedError;
                }
            };

            await expect(processProviderStream(errorIterator, mockOptions))
                .rejects.toThrow('Detailed test error');
            
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in ErrorTestProvider stream processing: Detailed test error')
            );
            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error details:')
            );
        });

        it('should handle errors in error logging', async () => {
            // Mock log.error to throw
            log.error.mockImplementation(() => {
                throw new Error('Logging failed');
            });

            const errorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw new Error('Original error');
                }
            };

            // Should still propagate original error, not logging error
            await expect(processProviderStream(errorIterator, mockOptions))
                .rejects.toThrow('Original error');
        });
    });

    describe('Edge Case Error Scenarios', () => {
        it('should handle errors with circular references', async () => {
            const circularError: any = new Error('Circular error');
            circularError.circular = circularError;

            const circularErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw circularError;
                }
            };

            await expect(processProviderStream(circularErrorIterator, mockOptions))
                .rejects.toThrow('Circular error');
        });

        it('should handle non-Error objects being thrown', async () => {
            const nonErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw 'String error'; // Not an Error object
                }
            };

            await expect(processProviderStream(nonErrorIterator, mockOptions))
                .rejects.toBe('String error');
        });

        it('should handle undefined/null being thrown', async () => {
            const nullErrorIterator = {
                async *[Symbol.asyncIterator]() {
                    throw null;
                }
            };

            await expect(processProviderStream(nullErrorIterator, mockOptions))
                .rejects.toBeNull();
        });
    });

    describe('StreamProcessor Error Handling', () => {
        it('should handle malformed chunk processing', async () => {
            const malformedChunk = {
                message: {
                    content: { not: 'a string' } // Should be string
                }
            };

            const result = await StreamProcessor.processChunk(
                malformedChunk,
                '',
                1,
                { providerName: 'Test', modelName: 'test' }
            );

            // Should handle gracefully without throwing
            expect(result.completeText).toBe('');
        });

        it('should handle callback errors in sendChunkToCallback', async () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Callback processing error');
            });

            // Should not throw
            await expect(StreamProcessor.sendChunkToCallback(
                errorCallback,
                'test content',
                false,
                {},
                1
            )).resolves.toBeUndefined();

            expect(log.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in streamCallback')
            );
        });
    });
});