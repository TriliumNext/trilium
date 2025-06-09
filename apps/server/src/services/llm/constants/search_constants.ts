export const SEARCH_CONSTANTS = {
    // Context extraction parameters
    CONTEXT: {
        CONTENT_LENGTH: {
            MEDIUM_THRESHOLD: 5000,
            HIGH_THRESHOLD: 10000
        },
        MAX_PARENT_DEPTH: 3,
        MAX_CHILDREN: 10,
        MAX_LINKS: 10,
        MAX_SIMILAR_NOTES: 5,
        MAX_CONTENT_LENGTH: 2000,
        MAX_RELATIONS: 10,
        MAX_POINTS: 5
    },

    // Hierarchy parameters
    HIERARCHY: {
        DEFAULT_QUERY_DEPTH: 2,
        MAX_NOTES_PER_QUERY: 10,
        MAX_PATH_LENGTH: 20,
        MAX_BREADTH: 100,
        MAX_DEPTH: 5,
        MAX_PATHS_TO_SHOW: 3
    },

    // Temperature settings
    TEMPERATURE: {
        DEFAULT: 0.7,
        RELATIONSHIP_TOOL: 0.4,
        QUERY_PROCESSOR: 0.3
    },

    // Token/char limits
    LIMITS: {
        DEFAULT_NOTE_SUMMARY_LENGTH: 500,
        DEFAULT_MAX_TOKENS: 4096,
        RELATIONSHIP_TOOL_MAX_TOKENS: 50,
        QUERY_PROCESSOR_MAX_TOKENS: 300,
        MIN_STRING_LENGTH: 3
    },

    // Tool execution parameters
    TOOL_EXECUTION: {
        MAX_TOOL_CALL_ITERATIONS: 5,
        MAX_FOLLOW_UP_ITERATIONS: 3
    }
};

// Model capabilities constants - moved from ./interfaces/model_capabilities.ts
export const MODEL_CAPABILITIES = {
    'gpt-3.5-turbo': {
        contextWindowTokens: 8192,
        contextWindowChars: 16000
    },
    'gpt-4': {
        contextWindowTokens: 8192
    },
    'gpt-4-turbo': {
        contextWindowTokens: 8192
    },
    'claude-3-opus': {
        contextWindowTokens: 200000
    },
    'claude-3-sonnet': {
        contextWindowTokens: 180000
    },
    'claude-3.5-sonnet': {
        contextWindowTokens: 200000
    },
    'default': {
        contextWindowTokens: 4096
    }
};

