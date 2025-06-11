import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolRegistry } from './tool_registry.js';
import type { ToolHandler } from './tool_interfaces.js';

// Mock dependencies
vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('ToolRegistry', () => {
    let registry: ToolRegistry;

    beforeEach(() => {
        // Reset singleton instance before each test
        (ToolRegistry as any).instance = undefined;
        registry = ToolRegistry.getInstance();
        
        // Clear any existing tools
        (registry as any).tools.clear();
        
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ToolRegistry.getInstance();
            const instance2 = ToolRegistry.getInstance();
            
            expect(instance1).toBe(instance2);
        });

        it('should create instance only once', () => {
            const instance1 = ToolRegistry.getInstance();
            const instance2 = ToolRegistry.getInstance();
            const instance3 = ToolRegistry.getInstance();
            
            expect(instance1).toBe(instance2);
            expect(instance2).toBe(instance3);
        });
    });

    describe('registerTool', () => {
        it('should register a valid tool handler', () => {
            const validHandler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'test_tool',
                        description: 'A test tool',
                        parameters: {
                            type: 'object' as const,
                            properties: {
                                input: { type: 'string', description: 'Input parameter' }
                            },
                            required: ['input']
                        }
                    }
                },
                execute: vi.fn().mockResolvedValue('result')
            };

            registry.registerTool(validHandler);
            
            expect(registry.getTool('test_tool')).toBe(validHandler);
        });

        it('should handle registration of multiple tools', () => {
            const tool1: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'tool1',
                        description: 'First tool',
                        parameters: {
                            type: 'object' as const,
                            properties: {},
                            required: []
                        }
                    }
                },
                execute: vi.fn()
            };

            const tool2: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'tool2', 
                        description: 'Second tool',
                        parameters: {
                            type: 'object' as const,
                            properties: {},
                            required: []
                        }
                    }
                },
                execute: vi.fn()
            };

            registry.registerTool(tool1);
            registry.registerTool(tool2);
            
            expect(registry.getTool('tool1')).toBe(tool1);
            expect(registry.getTool('tool2')).toBe(tool2);
            expect(registry.getAllTools()).toHaveLength(2);
        });

        it('should handle duplicate tool registration (overwrites)', () => {
            const handler1: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'duplicate_tool',
                        description: 'First version',
                        parameters: {
                            type: 'object' as const,
                            properties: {},
                            required: []
                        }
                    }
                },
                execute: vi.fn()
            };

            const handler2: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'duplicate_tool',
                        description: 'Second version',
                        parameters: {
                            type: 'object' as const,
                            properties: {},
                            required: []
                        }
                    }
                },
                execute: vi.fn()
            };

            registry.registerTool(handler1);
            registry.registerTool(handler2);
            
            // Should have the second handler (overwrites)
            expect(registry.getTool('duplicate_tool')).toBe(handler2);
            expect(registry.getAllTools()).toHaveLength(1);
        });
    });

    describe('getTool', () => {
        beforeEach(() => {
            const tools = [
                {
                    name: 'tool1',
                    description: 'First tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool2',
                    description: 'Second tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool3',
                    description: 'Third tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                }
            ];

            tools.forEach(tool => {
                const handler: ToolHandler = {
                    definition: {
                        type: 'function',
                        function: tool
                    },
                    execute: vi.fn()
                };
                registry.registerTool(handler);
            });
        });

        it('should return registered tool by name', () => {
            const tool = registry.getTool('tool1');
            expect(tool).toBeDefined();
            expect(tool?.definition.function.name).toBe('tool1');
        });

        it('should return undefined for non-existent tool', () => {
            const tool = registry.getTool('non_existent');
            expect(tool).toBeUndefined();
        });

        it('should handle case-sensitive tool names', () => {
            const tool = registry.getTool('Tool1'); // Different case
            expect(tool).toBeUndefined();
        });
    });

    describe('getAllTools', () => {
        beforeEach(() => {
            const tools = [
                {
                    name: 'tool1',
                    description: 'First tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool2',
                    description: 'Second tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool3',
                    description: 'Third tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                }
            ];

            tools.forEach(tool => {
                const handler: ToolHandler = {
                    definition: {
                        type: 'function',
                        function: tool
                    },
                    execute: vi.fn()
                };
                registry.registerTool(handler);
            });
        });

        it('should return all registered tools', () => {
            const tools = registry.getAllTools();
            
            expect(tools).toHaveLength(3);
            expect(tools.map(t => t.definition.function.name)).toEqual(['tool1', 'tool2', 'tool3']);
        });

        it('should return empty array when no tools registered', () => {
            (registry as any).tools.clear();
            
            const tools = registry.getAllTools();
            expect(tools).toHaveLength(0);
        });
    });

    describe('getAllToolDefinitions', () => {
        beforeEach(() => {
            const tools = [
                {
                    name: 'tool1',
                    description: 'First tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool2',
                    description: 'Second tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                },
                {
                    name: 'tool3',
                    description: 'Third tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                }
            ];

            tools.forEach(tool => {
                const handler: ToolHandler = {
                    definition: {
                        type: 'function',
                        function: tool
                    },
                    execute: vi.fn()
                };
                registry.registerTool(handler);
            });
        });

        it('should return all tool definitions', () => {
            const definitions = registry.getAllToolDefinitions();
            
            expect(definitions).toHaveLength(3);
            expect(definitions[0]).toEqual({
                type: 'function',
                function: {
                    name: 'tool1',
                    description: 'First tool',
                    parameters: {
                        type: 'object' as const,
                        properties: {},
                        required: []
                    }
                }
            });
        });

        it('should return empty array when no tools registered', () => {
            (registry as any).tools.clear();
            
            const definitions = registry.getAllToolDefinitions();
            expect(definitions).toHaveLength(0);
        });
    });

    describe('error handling', () => {
        it('should handle null/undefined tool handler gracefully', () => {
            // These should not crash the registry
            expect(() => registry.registerTool(null as any)).not.toThrow();
            expect(() => registry.registerTool(undefined as any)).not.toThrow();
            
            // Registry should still work normally
            expect(registry.getAllTools()).toHaveLength(0);
        });

        it('should handle malformed tool handler gracefully', () => {
            const malformedHandler = {
                // Missing definition
                execute: vi.fn()
            } as any;

            expect(() => registry.registerTool(malformedHandler)).not.toThrow();
            
            // Should not be registered
            expect(registry.getAllTools()).toHaveLength(0);
        });
    });

    describe('tool validation', () => {
        it('should accept tool with proper structure', () => {
            const validHandler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'calculator',
                        description: 'Performs calculations',
                        parameters: {
                            type: 'object' as const,
                            properties: {
                                expression: { 
                                    type: 'string', 
                                    description: 'The mathematical expression to evaluate' 
                                }
                            },
                            required: ['expression']
                        }
                    }
                },
                execute: vi.fn().mockResolvedValue('42')
            };

            registry.registerTool(validHandler);
            
            expect(registry.getTool('calculator')).toBe(validHandler);
            expect(registry.getAllTools()).toHaveLength(1);
        });
    });
});