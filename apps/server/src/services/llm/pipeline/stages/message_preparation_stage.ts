import { BasePipelineStage } from '../pipeline_stage.js';
import type { MessagePreparationInput } from '../interfaces.js';
import type { Message } from '../../ai_interface.js';
import { SYSTEM_PROMPTS } from '../../constants/llm_prompt_constants.js';
import { MessageFormatterFactory } from '../interfaces/message_formatter.js';
import toolRegistry from '../../tools/tool_registry.js';
import log from '../../../log.js';

/**
 * Pipeline stage for preparing messages for LLM completion
 */
export class MessagePreparationStage extends BasePipelineStage<MessagePreparationInput, { messages: Message[] }> {
    constructor() {
        super('MessagePreparation');
    }

    /**
     * Prepare messages for LLM completion, including system prompt and context
     * This uses provider-specific formatters to optimize the message structure
     */
    protected async process(input: MessagePreparationInput): Promise<{ messages: Message[] }> {
        const { messages, context, systemPrompt, options } = input;

        // Determine provider from model string if available (format: "provider:model")
        let provider = 'default';
        if (options?.model && options.model.includes(':')) {
            const [providerName] = options.model.split(':');
            provider = providerName;
        }

        // Check if tools are enabled
        const toolsEnabled = options?.enableTools === true;

        log.info(`Preparing messages for provider: ${provider}, context: ${!!context}, system prompt: ${!!systemPrompt}, tools: ${toolsEnabled}`);

        // Get appropriate formatter for this provider
        const formatter = MessageFormatterFactory.getFormatter(provider);

        // Determine the system prompt to use
        let finalSystemPrompt = systemPrompt || SYSTEM_PROMPTS.DEFAULT_SYSTEM_PROMPT;

        // If tools are enabled, enhance system prompt with tools guidance
        if (toolsEnabled) {
            const toolCount = toolRegistry.getAllTools().length;
            const toolsPrompt = `You have access to ${toolCount} tools to help you respond. When you need information that might be in the user's notes, use the search_notes tool to find relevant content or the read_note tool to read a specific note by ID. Use tools when specific information is required rather than making assumptions.`;

            // Add tools guidance to system prompt
            finalSystemPrompt = finalSystemPrompt + '\n\n' + toolsPrompt;
            log.info(`Enhanced system prompt with tools guidance: ${toolCount} tools available`);
        }

        // Format messages using provider-specific approach
        const formattedMessages = formatter.formatMessages(
            messages,
            finalSystemPrompt,
            context
        );

        log.info(`Formatted ${messages.length} messages into ${formattedMessages.length} messages for provider: ${provider}`);

        return { messages: formattedMessages };
    }
}
