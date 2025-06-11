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

describe('Tool Execution During Streaming Tests', () => {
    let mockOptions: ProviderStreamOptions;
    let receivedCallbacks: Array<{ text: string; done: boolean; chunk: any }>;

    beforeEach(() => {
        vi.clearAllMocks();
        receivedCallbacks = [];
        mockOptions = {
            providerName: 'ToolTestProvider',
            modelName: 'tool-capable-model'
        };
    });

    const mockCallback = (text: string, done: boolean, chunk: any) => {
        receivedCallbacks.push({ text, done, chunk });
    };

    describe('Basic Tool Call Handling', () => {
        it('should extract and process simple tool calls', async () => {
            const toolChunks = [
                { message: { content: 'Let me search for that' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_search_123',
                            type: 'function',
                            function: {
                                name: 'web_search',
                                arguments: '{"query": "weather today"}'
                            }
                        }]
                    }
                },
                { message: { content: 'The weather today is sunny.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of toolChunks) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.toolCalls).toHaveLength(1);
            expect(result.toolCalls[0]).toEqual({
                id: 'call_search_123',
                type: 'function',
                function: {
                    name: 'web_search',
                    arguments: '{"query": "weather today"}'
                }
            });
            expect(result.completeText).toBe('Let me search for thatThe weather today is sunny.');
        });

        it('should handle multiple tool calls in sequence', async () => {
            const multiToolChunks = [
                { message: { content: 'I need to use multiple tools' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_1',
                            function: { name: 'calculator', arguments: '{"expr": "2+2"}' }
                        }]
                    }
                },
                { message: { content: 'First calculation complete. Now searching...' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_2',
                            function: { name: 'web_search', arguments: '{"query": "math"}' }
                        }]
                    }
                },
                { message: { content: 'All tasks completed.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of multiToolChunks) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            // Should capture the last tool calls (overwriting previous ones as per implementation)
            expect(result.toolCalls).toHaveLength(1);
            expect(result.toolCalls[0].function.name).toBe('web_search');
        });

        it('should handle tool calls with complex arguments', async () => {
            const complexToolChunk = {
                message: {
                    tool_calls: [{
                        id: 'call_complex',
                        function: {
                            name: 'data_processor',
                            arguments: JSON.stringify({
                                dataset: {
                                    source: 'database',
                                    filters: { active: true, category: 'sales' },
                                    columns: ['id', 'name', 'amount', 'date']
                                },
                                operations: [
                                    { type: 'filter', condition: 'amount > 100' },
                                    { type: 'group', by: 'category' },
                                    { type: 'aggregate', function: 'sum', column: 'amount' }
                                ],
                                output: { format: 'json', include_metadata: true }
                            })
                        }
                    }]
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(complexToolChunk);
            
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].function.name).toBe('data_processor');
            
            const args = JSON.parse(toolCalls[0].function.arguments);
            expect(args.dataset.source).toBe('database');
            expect(args.operations).toHaveLength(3);
            expect(args.output.format).toBe('json');
        });
    });

    describe('Tool Call Extraction Edge Cases', () => {
        it('should handle empty tool_calls array', async () => {
            const emptyToolChunk = {
                message: {
                    content: 'No tools needed',
                    tool_calls: []
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(emptyToolChunk);
            expect(toolCalls).toEqual([]);
        });

        it('should handle malformed tool_calls', async () => {
            const malformedChunk = {
                message: {
                    tool_calls: 'not an array'
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(malformedChunk);
            expect(toolCalls).toEqual([]);
        });

        it('should handle missing function field in tool call', async () => {
            const incompleteToolChunk = {
                message: {
                    tool_calls: [{
                        id: 'call_incomplete',
                        type: 'function'
                        // Missing function field
                    }]
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(incompleteToolChunk);
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].id).toBe('call_incomplete');
        });

        it('should handle tool calls with invalid JSON arguments', async () => {
            const invalidJsonChunk = {
                message: {
                    tool_calls: [{
                        id: 'call_invalid_json',
                        function: {
                            name: 'test_tool',
                            arguments: '{"invalid": json}'  // Invalid JSON
                        }
                    }]
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(invalidJsonChunk);
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].function.arguments).toBe('{"invalid": json}');
        });
    });

    describe('Real-world Tool Execution Scenarios', () => {
        it('should handle calculator tool execution', async () => {
            const calculatorScenario = [
                { message: { content: 'Let me calculate that for you' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_calc_456',
                            function: {
                                name: 'calculator',
                                arguments: '{"expression": "15 * 37 + 22"}'
                            }
                        }]
                    }
                },
                { message: { content: 'The result is 577.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of calculatorScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.toolCalls[0].function.name).toBe('calculator');
            expect(result.completeText).toBe('Let me calculate that for youThe result is 577.');
        });

        it('should handle web search tool execution', async () => {
            const searchScenario = [
                { message: { content: 'Searching for current information...' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_search_789',
                            function: {
                                name: 'web_search',
                                arguments: '{"query": "latest AI developments 2024", "num_results": 5}'
                            }
                        }]
                    }
                },
                { message: { content: 'Based on my search, here are the latest AI developments...' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of searchScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.toolCalls[0].function.name).toBe('web_search');
            const args = JSON.parse(result.toolCalls[0].function.arguments);
            expect(args.num_results).toBe(5);
        });

        it('should handle file operations tool execution', async () => {
            const fileOpScenario = [
                { message: { content: 'I\'ll help you analyze that file' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_file_read',
                            function: {
                                name: 'read_file',
                                arguments: '{"path": "/data/report.csv", "encoding": "utf-8"}'
                            }
                        }]
                    }
                },
                { message: { content: 'File contents analyzed. The report contains...' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_file_write',
                            function: {
                                name: 'write_file',
                                arguments: '{"path": "/data/summary.txt", "content": "Analysis summary..."}'
                            }
                        }]
                    }
                },
                { message: { content: 'Summary saved successfully.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of fileOpScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            // Should have the last tool call
            expect(result.toolCalls[0].function.name).toBe('write_file');
        });
    });

    describe('Tool Execution with Content Streaming', () => {
        it('should interleave tool calls with content correctly', async () => {
            const interleavedScenario = [
                { message: { content: 'Starting analysis' } },
                {
                    message: {
                        content: ' with tools.',
                        tool_calls: [{
                            id: 'call_analyze',
                            function: { name: 'analyzer', arguments: '{}' }
                        }]
                    }
                },
                { message: { content: ' Tool executed.' } },
                { message: { content: ' Final results ready.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of interleavedScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.completeText).toBe('Starting analysis with tools. Tool executed. Final results ready.');
            expect(result.toolCalls).toHaveLength(1);
        });

        it('should handle tool calls without content in same chunk', async () => {
            const toolOnlyChunks = [
                { message: { content: 'Preparing to use tools' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_tool_only',
                            function: { name: 'silent_tool', arguments: '{}' }
                        }]
                        // No content in this chunk
                    }
                },
                { message: { content: 'Tool completed silently' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of toolOnlyChunks) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.completeText).toBe('Preparing to use toolsTool completed silently');
            expect(result.toolCalls[0].function.name).toBe('silent_tool');
        });
    });

    describe('Provider-Specific Tool Formats', () => {
        it('should handle OpenAI tool call format', async () => {
            const openAIToolFormat = {
                choices: [{
                    delta: {
                        tool_calls: [{
                            index: 0,
                            id: 'call_openai_123',
                            type: 'function',
                            function: {
                                name: 'get_weather',
                                arguments: '{"location": "San Francisco"}'
                            }
                        }]
                    }
                }]
            };

            // Convert to our standard format for testing
            const standardFormat = {
                message: {
                    tool_calls: openAIToolFormat.choices[0].delta.tool_calls
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(standardFormat);
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].function.name).toBe('get_weather');
        });

        it('should handle Anthropic tool call format', async () => {
            // Anthropic uses different format - simulate conversion
            const anthropicToolData = {
                type: 'tool_use',
                id: 'call_anthropic_456',
                name: 'search_engine',
                input: { query: 'best restaurants nearby' }
            };

            // Convert to our standard format
            const standardFormat = {
                message: {
                    tool_calls: [{
                        id: anthropicToolData.id,
                        function: {
                            name: anthropicToolData.name,
                            arguments: JSON.stringify(anthropicToolData.input)
                        }
                    }]
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(standardFormat);
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].function.name).toBe('search_engine');
        });
    });

    describe('Tool Execution Error Scenarios', () => {
        it('should handle tool execution errors in stream', async () => {
            const toolErrorScenario = [
                { message: { content: 'Attempting tool execution' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_error_test',
                            function: {
                                name: 'failing_tool',
                                arguments: '{"param": "value"}'
                            }
                        }]
                    }
                },
                { 
                    message: { 
                        content: 'Tool execution failed: Permission denied',
                        error: 'Tool execution error' 
                    } 
                },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of toolErrorScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.toolCalls[0].function.name).toBe('failing_tool');
            expect(result.completeText).toContain('Tool execution failed');
        });

        it('should handle timeout in tool execution', async () => {
            const timeoutScenario = [
                { message: { content: 'Starting long-running tool' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'call_timeout',
                            function: { name: 'slow_tool', arguments: '{}' }
                        }]
                    }
                },
                { message: { content: 'Tool timed out after 30 seconds' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of timeoutScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            expect(result.completeText).toContain('timed out');
        });
    });

    describe('Complex Tool Workflows', () => {
        it('should handle multi-step tool workflow', async () => {
            const workflowScenario = [
                { message: { content: 'Starting multi-step analysis' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'step1',
                            function: { name: 'data_fetch', arguments: '{"source": "api"}' }
                        }]
                    }
                },
                { message: { content: 'Data fetched. Processing...' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'step2', 
                            function: { name: 'data_process', arguments: '{"format": "json"}' }
                        }]
                    }
                },
                { message: { content: 'Processing complete. Generating report...' } },
                {
                    message: {
                        tool_calls: [{
                            id: 'step3',
                            function: { name: 'report_generate', arguments: '{"type": "summary"}' }
                        }]
                    }
                },
                { message: { content: 'Workflow completed successfully.' } },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of workflowScenario) {
                        yield chunk;
                    }
                }
            };

            const result = await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            // Should capture the last tool call
            expect(result.toolCalls[0].function.name).toBe('report_generate');
            expect(result.completeText).toContain('Workflow completed successfully');
        });

        it('should handle parallel tool execution indication', async () => {
            const parallelToolsChunk = {
                message: {
                    tool_calls: [
                        {
                            id: 'parallel_1',
                            function: { name: 'fetch_weather', arguments: '{"city": "NYC"}' }
                        },
                        {
                            id: 'parallel_2', 
                            function: { name: 'fetch_news', arguments: '{"topic": "technology"}' }
                        },
                        {
                            id: 'parallel_3',
                            function: { name: 'fetch_stocks', arguments: '{"symbol": "AAPL"}' }
                        }
                    ]
                }
            };

            const toolCalls = StreamProcessor.extractToolCalls(parallelToolsChunk);
            expect(toolCalls).toHaveLength(3);
            expect(toolCalls.map(tc => tc.function.name)).toEqual([
                'fetch_weather', 'fetch_news', 'fetch_stocks'
            ]);
        });
    });

    describe('Tool Call Logging and Debugging', () => {
        it('should log tool call detection', async () => {
            const log = (await import('../../log.js')).default;
            
            const toolChunk = {
                message: {
                    tool_calls: [{
                        id: 'log_test',
                        function: { name: 'test_tool', arguments: '{}' }
                    }]
                }
            };

            StreamProcessor.extractToolCalls(toolChunk);
            
            expect(log.info).toHaveBeenCalledWith(
                'Detected 1 tool calls in stream chunk'
            );
        });

        it('should handle tool calls in callback correctly', async () => {
            const toolCallbackScenario = [
                {
                    message: {
                        tool_calls: [{
                            id: 'callback_test',
                            function: { name: 'callback_tool', arguments: '{"test": true}' }
                        }]
                    }
                },
                { done: true }
            ];

            const mockIterator = {
                async *[Symbol.asyncIterator]() {
                    for (const chunk of toolCallbackScenario) {
                        yield chunk;
                    }
                }
            };

            await processProviderStream(
                mockIterator,
                mockOptions,
                mockCallback
            );

            // Should have received callback for tool execution chunk
            const toolCallbacks = receivedCallbacks.filter(cb => 
                cb.chunk && cb.chunk.message && cb.chunk.message.tool_calls
            );
            expect(toolCallbacks.length).toBeGreaterThan(0);
        });
    });
});