import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFormatter, buildMessagesWithContext, buildContextFromNotes } from './message_formatter.js';
import type { Message } from '../../ai_interface.js';

// Mock the constants
vi.mock('../../constants/llm_prompt_constants.js', () => ({
    CONTEXT_PROMPTS: {
        CONTEXT_NOTES_WRAPPER: 'Here are some relevant notes:\n\n{noteContexts}\n\nNow please answer this query: {query}'
    }
}));

describe('MessageFormatter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getFormatter', () => {
        it('should return a formatter for any provider', () => {
            const formatter = getFormatter('openai');
            
            expect(formatter).toBeDefined();
            expect(typeof formatter.formatMessages).toBe('function');
        });

        it('should return the same interface for different providers', () => {
            const openaiFormatter = getFormatter('openai');
            const anthropicFormatter = getFormatter('anthropic');
            const ollamaFormatter = getFormatter('ollama');
            
            expect(openaiFormatter.formatMessages).toBeDefined();
            expect(anthropicFormatter.formatMessages).toBeDefined();
            expect(ollamaFormatter.formatMessages).toBeDefined();
        });
    });

    describe('formatMessages', () => {
        it('should format messages without system prompt or context', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there!' }
            ];

            const result = formatter.formatMessages(messages);

            expect(result).toEqual(messages);
        });

        it('should add system message with context', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'This is important context';

            const result = formatter.formatMessages(messages, undefined, context);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                role: 'system',
                content: 'Use the following context to answer the query: This is important context'
            });
            expect(result[1]).toEqual(messages[0]);
        });

        it('should add system message with custom system prompt', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const systemPrompt = 'You are a helpful assistant';

            const result = formatter.formatMessages(messages, systemPrompt);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                role: 'system',
                content: 'You are a helpful assistant'
            });
            expect(result[1]).toEqual(messages[0]);
        });

        it('should prefer system prompt over context when both are provided', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const systemPrompt = 'You are a helpful assistant';
            const context = 'This is context';

            const result = formatter.formatMessages(messages, systemPrompt, context);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                role: 'system',
                content: 'You are a helpful assistant'
            });
        });

        it('should skip duplicate system messages', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'system', content: 'Original system message' },
                { role: 'user', content: 'Hello' }
            ];
            const systemPrompt = 'New system prompt';

            const result = formatter.formatMessages(messages, systemPrompt);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                role: 'system',
                content: 'New system prompt'
            });
            expect(result[1]).toEqual(messages[1]);
        });

        it('should preserve existing system message when no new one is provided', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'system', content: 'Original system message' },
                { role: 'user', content: 'Hello' }
            ];

            const result = formatter.formatMessages(messages);

            expect(result).toEqual(messages);
        });

        it('should handle empty messages array', () => {
            const formatter = getFormatter('openai');
            
            const result = formatter.formatMessages([]);

            expect(result).toEqual([]);
        });

        it('should handle messages with tool calls', () => {
            const formatter = getFormatter('openai');
            const messages: Message[] = [
                { role: 'user', content: 'Search for notes about AI' },
                {
                    role: 'assistant',
                    content: 'I need to search for notes.',
                    tool_calls: [
                        {
                            id: 'call_123',
                            type: 'function',
                            function: {
                                name: 'searchNotes',
                                arguments: '{"query": "AI"}'
                            }
                        }
                    ]
                },
                {
                    role: 'tool',
                    content: 'Found 3 notes about AI',
                    tool_call_id: 'call_123'
                },
                { role: 'assistant', content: 'I found 3 notes about AI for you.' }
            ];

            const result = formatter.formatMessages(messages);

            expect(result).toEqual(messages);
            expect(result[1].tool_calls).toBeDefined();
            expect(result[2].tool_call_id).toBe('call_123');
        });
    });

    describe('buildMessagesWithContext', () => {
        it('should build messages with context using service class', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'Important context';
            const mockService = {
                constructor: { name: 'OpenAIService' }
            };

            const result = await buildMessagesWithContext(messages, context, mockService);

            expect(result).toHaveLength(2);
            expect(result[0].role).toBe('system');
            expect(result[0].content).toContain('Important context');
            expect(result[1]).toEqual(messages[0]);
        });

        it('should handle string provider name', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'Important context';

            const result = await buildMessagesWithContext(messages, context, 'anthropic');

            expect(result).toHaveLength(2);
            expect(result[0].role).toBe('system');
            expect(result[1]).toEqual(messages[0]);
        });

        it('should return empty array for empty messages', async () => {
            const result = await buildMessagesWithContext([], 'context', 'openai');

            expect(result).toEqual([]);
        });

        it('should return original messages when no context provided', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];

            const result = await buildMessagesWithContext(messages, '', 'openai');

            expect(result).toEqual(messages);
        });

        it('should return original messages when context is whitespace', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];

            const result = await buildMessagesWithContext(messages, '   \n\t   ', 'openai');

            expect(result).toEqual(messages);
        });

        it('should handle service without constructor name', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'Important context';
            const mockService = {}; // No constructor property

            const result = await buildMessagesWithContext(messages, context, mockService);

            expect(result).toHaveLength(2);
            expect(result[0].role).toBe('system');
        });

        it('should handle errors gracefully', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'Important context';
            const mockService = {
                constructor: {
                    get name() {
                        throw new Error('Constructor error');
                    }
                }
            };

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await buildMessagesWithContext(messages, context, mockService);

            expect(result).toEqual(messages); // Should fallback to original messages
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error building messages with context')
            );

            consoleErrorSpy.mockRestore();
        });

        it('should extract provider name from various service class names', async () => {
            const messages: Message[] = [
                { role: 'user', content: 'Hello' }
            ];
            const context = 'test context';

            const services = [
                { constructor: { name: 'OpenAIService' } },
                { constructor: { name: 'AnthropicService' } },
                { constructor: { name: 'OllamaService' } },
                { constructor: { name: 'CustomAIService' } }
            ];

            for (const service of services) {
                const result = await buildMessagesWithContext(messages, context, service);
                expect(result).toHaveLength(2);
                expect(result[0].role).toBe('system');
            }
        });
    });

    describe('buildContextFromNotes', () => {
        it('should build context from notes with content', () => {
            const sources = [
                {
                    title: 'Note 1',
                    content: 'This is the content of note 1'
                },
                {
                    title: 'Note 2',
                    content: 'This is the content of note 2'
                }
            ];
            const query = 'What is the content?';

            const result = buildContextFromNotes(sources, query);

            expect(result).toContain('Here are some relevant notes:');
            expect(result).toContain('### Note 1');
            expect(result).toContain('This is the content of note 1');
            expect(result).toContain('### Note 2');
            expect(result).toContain('This is the content of note 2');
            expect(result).toContain('What is the content?');
            expect(result).toContain('<note>');
            expect(result).toContain('</note>');
        });

        it('should filter out sources without content', () => {
            const sources = [
                {
                    title: 'Note 1',
                    content: 'This has content'
                },
                {
                    title: 'Note 2',
                    content: null // No content
                },
                {
                    title: 'Note 3',
                    content: 'This also has content'
                }
            ];
            const query = 'Test query';

            const result = buildContextFromNotes(sources, query);

            expect(result).toContain('Note 1');
            expect(result).not.toContain('Note 2');
            expect(result).toContain('Note 3');
        });

        it('should handle empty sources array', () => {
            const result = buildContextFromNotes([], 'Test query');

            expect(result).toBe('Test query');
        });

        it('should handle null/undefined sources', () => {
            const result1 = buildContextFromNotes(null as any, 'Test query');
            const result2 = buildContextFromNotes(undefined as any, 'Test query');

            expect(result1).toBe('Test query');
            expect(result2).toBe('Test query');
        });

        it('should handle empty query', () => {
            const sources = [
                {
                    title: 'Note 1',
                    content: 'Content 1'
                }
            ];

            const result = buildContextFromNotes(sources, '');

            expect(result).toContain('### Note 1');
            expect(result).toContain('Content 1');
        });

        it('should handle sources with empty content arrays', () => {
            const sources = [
                {
                    title: 'Note 1',
                    content: 'Has content'
                },
                {
                    title: 'Note 2',
                    content: '' // Empty string
                }
            ];
            const query = 'Test';

            const result = buildContextFromNotes(sources, query);

            expect(result).toContain('Note 1');
            expect(result).toContain('Has content');
            expect(result).not.toContain('Note 2');
        });

        it('should handle sources with undefined content', () => {
            const sources = [
                {
                    title: 'Note 1',
                    content: 'Has content'
                },
                {
                    title: 'Note 2'
                    // content is undefined
                }
            ];
            const query = 'Test';

            const result = buildContextFromNotes(sources, query);

            expect(result).toContain('Note 1');
            expect(result).toContain('Has content');
            expect(result).not.toContain('Note 2');
        });

        it('should wrap each note in proper tags', () => {
            const sources = [
                {
                    title: 'Test Note',
                    content: 'Test content'
                }
            ];
            const query = 'Query';

            const result = buildContextFromNotes(sources, query);

            expect(result).toMatch(/<note>\s*### Test Note\s*Test content\s*<\/note>/);
        });

        it('should handle special characters in titles and content', () => {
            const sources = [
                {
                    title: 'Note with "quotes" & symbols',
                    content: 'Content with <tags> and & symbols'
                }
            ];
            const query = 'Special characters test';

            const result = buildContextFromNotes(sources, query);

            expect(result).toContain('Note with "quotes" & symbols');
            expect(result).toContain('Content with <tags> and & symbols');
        });
    });
});