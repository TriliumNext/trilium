import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatPipeline } from './chat_pipeline.js';
import type { ChatPipelineInput, ChatPipelineConfig } from './interfaces.js';
import type { Message, ChatResponse } from '../ai_interface.js';

// Mock all pipeline stages as classes that can be instantiated
vi.mock('./stages/context_extraction_stage.js', () => {
    class MockContextExtractionStage {
        execute = vi.fn().mockResolvedValue({});
    }
    return { ContextExtractionStage: MockContextExtractionStage };
});

vi.mock('./stages/semantic_context_extraction_stage.js', () => {
    class MockSemanticContextExtractionStage {
        execute = vi.fn().mockResolvedValue({
            context: ''
        });
    }
    return { SemanticContextExtractionStage: MockSemanticContextExtractionStage };
});

vi.mock('./stages/agent_tools_context_stage.js', () => {
    class MockAgentToolsContextStage {
        execute = vi.fn().mockResolvedValue({});
    }
    return { AgentToolsContextStage: MockAgentToolsContextStage };
});

vi.mock('./stages/message_preparation_stage.js', () => {
    class MockMessagePreparationStage {
        execute = vi.fn().mockResolvedValue({
            messages: [{ role: 'user', content: 'Hello' }]
        });
    }
    return { MessagePreparationStage: MockMessagePreparationStage };
});

vi.mock('./stages/model_selection_stage.js', () => {
    class MockModelSelectionStage {
        execute = vi.fn().mockResolvedValue({
            options: {
                provider: 'openai',
                model: 'gpt-4',
                enableTools: true,
                stream: false
            }
        });
    }
    return { ModelSelectionStage: MockModelSelectionStage };
});

vi.mock('./stages/llm_completion_stage.js', () => {
    class MockLLMCompletionStage {
        execute = vi.fn().mockResolvedValue({
            response: {
                text: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            }
        });
    }
    return { LLMCompletionStage: MockLLMCompletionStage };
});

vi.mock('./stages/response_processing_stage.js', () => {
    class MockResponseProcessingStage {
        execute = vi.fn().mockResolvedValue({
            text: 'Hello! How can I help you?'
        });
    }
    return { ResponseProcessingStage: MockResponseProcessingStage };
});

vi.mock('./stages/tool_calling_stage.js', () => {
    class MockToolCallingStage {
        execute = vi.fn().mockResolvedValue({
            needsFollowUp: false,
            messages: []
        });
    }
    return { ToolCallingStage: MockToolCallingStage };
});

vi.mock('../tools/tool_registry.js', () => ({
    default: {
        getTools: vi.fn().mockReturnValue([]),
        executeTool: vi.fn()
    }
}));

vi.mock('../tools/tool_initializer.js', () => ({
    default: {
        initializeTools: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../ai_service_manager.js', () => ({
    default: {
        getService: vi.fn().mockReturnValue({
            decomposeQuery: vi.fn().mockResolvedValue({
                subQueries: [{ text: 'test query' }],
                complexity: 3
            })
        })
    }
}));

vi.mock('../context/services/query_processor.js', () => ({
    default: {
        decomposeQuery: vi.fn().mockResolvedValue({
            subQueries: [{ text: 'test query' }],
            complexity: 3
        })
    }
}));

vi.mock('../constants/search_constants.js', () => ({
    SEARCH_CONSTANTS: {
        TOOL_EXECUTION: {
            MAX_TOOL_CALL_ITERATIONS: 5
        }
    }
}));

vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('ChatPipeline', () => {
    let pipeline: ChatPipeline;

    beforeEach(() => {
        vi.clearAllMocks();
        pipeline = new ChatPipeline();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(pipeline.config).toEqual({
                enableStreaming: true,
                enableMetrics: true,
                maxToolCallIterations: 5
            });
        });

        it('should accept custom configuration', () => {
            const customConfig: Partial<ChatPipelineConfig> = {
                enableStreaming: false,
                maxToolCallIterations: 5
            };
            
            const customPipeline = new ChatPipeline(customConfig);
            
            expect(customPipeline.config).toEqual({
                enableStreaming: false,
                enableMetrics: true,
                maxToolCallIterations: 5
            });
        });

        it('should initialize all pipeline stages', () => {
            expect(pipeline.stages.contextExtraction).toBeDefined();
            expect(pipeline.stages.semanticContextExtraction).toBeDefined();
            expect(pipeline.stages.agentToolsContext).toBeDefined();
            expect(pipeline.stages.messagePreparation).toBeDefined();
            expect(pipeline.stages.modelSelection).toBeDefined();
            expect(pipeline.stages.llmCompletion).toBeDefined();
            expect(pipeline.stages.responseProcessing).toBeDefined();
            expect(pipeline.stages.toolCalling).toBeDefined();
        });

        it('should initialize metrics', () => {
            expect(pipeline.metrics).toEqual({
                totalExecutions: 0,
                averageExecutionTime: 0,
                stageMetrics: {
                    contextExtraction: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    semanticContextExtraction: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    agentToolsContext: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    messagePreparation: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    modelSelection: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    llmCompletion: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    responseProcessing: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    toolCalling: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    }
                }
            });
        });
    });

    describe('execute', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello' }
        ];

        const input: ChatPipelineInput = {
            query: 'Hello',
            messages,
            options: {
                useAdvancedContext: true  // Enable advanced context to trigger full pipeline flow
            },
            noteId: 'note-123'
        };

        it('should execute all pipeline stages in order', async () => {
            const result = await pipeline.execute(input);
            
            // Get the mock instances from the pipeline stages
            expect(pipeline.stages.modelSelection.execute).toHaveBeenCalled();
            expect(pipeline.stages.messagePreparation.execute).toHaveBeenCalled();
            expect(pipeline.stages.llmCompletion.execute).toHaveBeenCalled();
            expect(pipeline.stages.responseProcessing.execute).toHaveBeenCalled();
            
            expect(result).toEqual({
                text: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            });
        });

        it('should increment total executions metric', async () => {
            const initialExecutions = pipeline.metrics.totalExecutions;
            
            await pipeline.execute(input);
            
            expect(pipeline.metrics.totalExecutions).toBe(initialExecutions + 1);
        });

        it('should handle streaming callback', async () => {
            const streamCallback = vi.fn();
            const inputWithStream = { ...input, streamCallback };
            
            await pipeline.execute(inputWithStream);
            
            expect(pipeline.stages.llmCompletion.execute).toHaveBeenCalled();
        });

        it('should handle tool calling iterations', async () => {
            // Mock LLM response to include tool calls
            (pipeline.stages.llmCompletion.execute as any).mockResolvedValue({
                response: {
                    text: 'Hello! How can I help you?',
                    role: 'assistant',
                    finish_reason: 'stop',
                    tool_calls: [{ id: 'tool1', function: { name: 'search', arguments: '{}' } }]
                }
            });
            
            // Mock tool calling to require iteration then stop
            (pipeline.stages.toolCalling.execute as any)
                .mockResolvedValueOnce({ needsFollowUp: true, messages: [] })
                .mockResolvedValueOnce({ needsFollowUp: false, messages: [] });
            
            await pipeline.execute(input);
            
            expect(pipeline.stages.toolCalling.execute).toHaveBeenCalledTimes(2);
        });

        it('should respect max tool call iterations', async () => {
            // Mock LLM response to include tool calls
            (pipeline.stages.llmCompletion.execute as any).mockResolvedValue({
                response: {
                    text: 'Hello! How can I help you?',
                    role: 'assistant',
                    finish_reason: 'stop',
                    tool_calls: [{ id: 'tool1', function: { name: 'search', arguments: '{}' } }]
                }
            });
            
            // Mock tool calling to always require iteration
            (pipeline.stages.toolCalling.execute as any).mockResolvedValue({ needsFollowUp: true, messages: [] });
            
            await pipeline.execute(input);
            
            // Should be called maxToolCallIterations times (5 iterations as configured)
            expect(pipeline.stages.toolCalling.execute).toHaveBeenCalledTimes(5);
        });

        it('should handle stage errors gracefully', async () => {
            (pipeline.stages.modelSelection.execute as any).mockRejectedValueOnce(new Error('Model selection failed'));
            
            await expect(pipeline.execute(input)).rejects.toThrow('Model selection failed');
        });

        it('should pass context between stages', async () => {
            await pipeline.execute(input);
            
            // Check that stage was called (the actual context passing is tested in integration)
            expect(pipeline.stages.messagePreparation.execute).toHaveBeenCalled();
        });

        it('should handle empty messages', async () => {
            const emptyInput = { ...input, messages: [] };
            
            const result = await pipeline.execute(emptyInput);
            
            expect(result).toBeDefined();
            expect(pipeline.stages.modelSelection.execute).toHaveBeenCalled();
        });

        it('should calculate content length for model selection', async () => {
            await pipeline.execute(input);
            
            expect(pipeline.stages.modelSelection.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    contentLength: expect.any(Number)
                })
            );
        });

        it('should update average execution time', async () => {
            const initialAverage = pipeline.metrics.averageExecutionTime;
            
            await pipeline.execute(input);
            
            expect(pipeline.metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
        });

        it('should disable streaming when config is false', async () => {
            const noStreamPipeline = new ChatPipeline({ enableStreaming: false });
            
            await noStreamPipeline.execute(input);
            
            expect(noStreamPipeline.stages.llmCompletion.execute).toHaveBeenCalled();
        });

        it('should handle concurrent executions', async () => {
            const promise1 = pipeline.execute(input);
            const promise2 = pipeline.execute(input);
            
            const [result1, result2] = await Promise.all([promise1, promise2]);
            
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
            expect(pipeline.metrics.totalExecutions).toBe(2);
        });
    });

    describe('metrics', () => {
        const input: ChatPipelineInput = {
            query: 'Hello',
            messages: [{ role: 'user', content: 'Hello' }],
            options: {
                useAdvancedContext: true
            },
            noteId: 'note-123'
        };

        it('should track stage execution times when metrics enabled', async () => {
            await pipeline.execute(input);
            
            expect(pipeline.metrics.stageMetrics.modelSelection.totalExecutions).toBe(1);
            expect(pipeline.metrics.stageMetrics.llmCompletion.totalExecutions).toBe(1);
        });

        it('should skip stage metrics when disabled', async () => {
            const noMetricsPipeline = new ChatPipeline({ enableMetrics: false });
            
            await noMetricsPipeline.execute(input);
            
            // Total executions is still tracked, but stage metrics are not updated
            expect(noMetricsPipeline.metrics.totalExecutions).toBe(1);
            expect(noMetricsPipeline.metrics.stageMetrics.modelSelection.totalExecutions).toBe(0);
            expect(noMetricsPipeline.metrics.stageMetrics.llmCompletion.totalExecutions).toBe(0);
        });
    });

    describe('error handling', () => {
        const input: ChatPipelineInput = {
            query: 'Hello',
            messages: [{ role: 'user', content: 'Hello' }],
            options: {
                useAdvancedContext: true
            },
            noteId: 'note-123'
        };

        it('should propagate errors from stages', async () => {
            (pipeline.stages.modelSelection.execute as any).mockRejectedValueOnce(new Error('Model selection failed'));
            
            await expect(pipeline.execute(input)).rejects.toThrow('Model selection failed');
        });

        it('should handle invalid input gracefully', async () => {
            const invalidInput = {
                query: '',
                messages: [],
                options: {},
                noteId: ''
            };
            
            const result = await pipeline.execute(invalidInput);
            
            expect(result).toBeDefined();
        });
    });
});