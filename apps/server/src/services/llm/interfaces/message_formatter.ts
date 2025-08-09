import type { Message } from "../ai_interface.js";

/**
 * Interface for provider-specific message formatters
 * This allows each provider to have custom formatting logic while maintaining a consistent interface
 */
export interface MessageFormatter {
    /**
     * Format messages for a specific LLM provider
     *
     * @param messages Array of messages to format
     * @param systemPrompt Optional system prompt to include
     * @param context Optional context to incorporate into messages
     * @returns Formatted messages ready to send to the provider
     */
    formatMessages(messages: Message[], systemPrompt?: string, context?: string): Message[];

    /**
     * Clean context content to prepare it for this specific provider
     *
     * @param content The raw context content
     * @returns Cleaned and formatted context content
     */
    cleanContextContent(content: string): string;

    /**
     * Get the maximum recommended context length for this provider
     *
     * @returns Maximum context length in characters
     */
    getMaxContextLength(): number;
}

/**
 * Default message formatter implementation
 */
class DefaultMessageFormatter implements MessageFormatter {
    formatMessages(messages: Message[], systemPrompt?: string, context?: string): Message[] {
        const formattedMessages: Message[] = [];
        
        // Add system prompt if provided
        if (systemPrompt || context) {
            const systemContent = [systemPrompt, context].filter(Boolean).join('\n\n');
            if (systemContent) {
                formattedMessages.push({
                    role: 'system',
                    content: systemContent
                });
            }
        }
        
        // Add the rest of the messages
        formattedMessages.push(...messages);
        
        return formattedMessages;
    }

    cleanContextContent(content: string): string {
        // Basic cleanup: trim and remove excessive whitespace
        return content.trim().replace(/\n{3,}/g, '\n\n');
    }

    getMaxContextLength(): number {
        // Default to a reasonable context length
        return 10000;
    }
}

/**
 * Factory to get the appropriate message formatter for a provider
 */
export class MessageFormatterFactory {
    // Cache formatters for reuse
    private static formatters: Record<string, MessageFormatter> = {};

    /**
     * Get the appropriate message formatter for a provider
     *
     * @param providerName Name of the LLM provider (e.g., 'openai', 'anthropic', 'ollama')
     * @returns MessageFormatter instance for the specified provider
     */
    static getFormatter(providerName: string): MessageFormatter {
        // Normalize provider name and handle variations
        let providerKey: string;

        // Normalize provider name from various forms (constructor.name, etc.)
        if (providerName.toLowerCase().includes('openai')) {
            providerKey = 'openai';
        } else if (providerName.toLowerCase().includes('anthropic') ||
                  providerName.toLowerCase().includes('claude')) {
            providerKey = 'anthropic';
        } else if (providerName.toLowerCase().includes('ollama')) {
            providerKey = 'ollama';
        } else {
            // Default to lowercase of whatever name we got
            providerKey = providerName.toLowerCase();
        }

        // Return cached formatter if available
        if (this.formatters[providerKey]) {
            return this.formatters[providerKey];
        }

        // For now, all providers use the default formatter
        // In the future, we can add provider-specific formatters here
        this.formatters[providerKey] = new DefaultMessageFormatter();

        return this.formatters[providerKey];
    }
}
