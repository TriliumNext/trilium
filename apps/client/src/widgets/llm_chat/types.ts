/**
 * Types for LLM Chat Panel
 */

export interface ChatResponse {
    id: string;
    messages: Array<{role: string; content: string}>;
    sources?: Array<{noteId: string; title: string}>;
}

export interface SessionResponse {
    id: string;
    title: string;
    noteId: string; // The ID of the chat note
}

export interface ToolExecutionStep {
    type: string;
    name?: string;
    content: string;
}

export interface MessageData {
    role: string;
    content: string;
    timestamp?: Date;
    mentions?: Array<{
        noteId: string;
        title: string;
        notePath: string;
    }>;
}

export interface ChatData {
    messages: MessageData[];
    noteId: string; // The ID of the chat note
    chatNoteId?: string; // Deprecated - kept for backward compatibility, should equal noteId
    toolSteps: ToolExecutionStep[];
    sources?: Array<{
        noteId: string;
        title: string;
        similarity?: number;
        content?: string;
    }>;
    metadata?: {
        model?: string;
        provider?: string;
        temperature?: number;
        maxTokens?: number;
        lastUpdated?: string;
        toolExecutions?: Array<{
            id: string;
            name: string;
            arguments: any;
            result: any;
            error?: string;
            timestamp: string;
        }>;
    };
}
