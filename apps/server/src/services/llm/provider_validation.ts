/**
 * Provider Validation Service
 *
 * Validates AI provider configurations before initializing the chat system.
 * This prevents startup errors when AI is enabled but providers are misconfigured.
 */

import log from "../log.js";
import options from "../options.js";

export interface ProviderValidationResult {
    hasValidProviders: boolean;
    validChatProviders: string[];
    errors: string[];
    warnings: string[];
}

/**
 * Simplified provider validation - just checks configuration without creating providers
 */
export async function validateProviders(): Promise<ProviderValidationResult> {
    const result: ProviderValidationResult = {
        hasValidProviders: false,
        validChatProviders: [],
        errors: [],
        warnings: []
    };

    log.info("Starting provider validation...");

    // Check if AI is enabled
    const aiEnabled = await options.getOptionBool('aiEnabled');
    if (!aiEnabled) {
        log.info("AI is disabled, skipping provider validation");
        return result;
    }

    // Check chat provider configurations
    await checkChatProviderConfigs(result);

    // Update overall validation status
    result.hasValidProviders = result.validChatProviders.length > 0;

    if (result.hasValidProviders) {
        log.info(`Provider validation successful. Valid chat providers: ${result.validChatProviders.join(', ')}`);
    } else {
        log.info("No valid providers found");
    }

    return result;
}

/**
 * Check chat provider configurations without creating providers
 */
async function checkChatProviderConfigs(result: ProviderValidationResult): Promise<void> {
    try {
        // Check OpenAI chat provider
        const openaiApiKey = await options.getOption('openaiApiKey');
        const openaiBaseUrl = await options.getOption('openaiBaseUrl');

        if (openaiApiKey || openaiBaseUrl) {
            result.validChatProviders.push('openai');
            log.info("OpenAI chat provider configuration available");
        }

        // Check Anthropic chat provider
        const anthropicApiKey = await options.getOption('anthropicApiKey');
        if (anthropicApiKey) {
            result.validChatProviders.push('anthropic');
            log.info("Anthropic chat provider configuration available");
        }

        // Check Ollama chat provider
        const ollamaBaseUrl = await options.getOption('ollamaBaseUrl');
        if (ollamaBaseUrl) {
            result.validChatProviders.push('ollama');
            log.info("Ollama chat provider configuration available");
        }

    } catch (error: any) {
        result.errors.push(`Error checking chat provider configs: ${error.message || 'Unknown error'}`);
    }
}

export default {
    validateProviders
};
