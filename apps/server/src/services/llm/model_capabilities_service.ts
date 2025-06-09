import log from '../log.js';
import type { ModelCapabilities } from './interfaces/model_capabilities.js';
import { DEFAULT_MODEL_CAPABILITIES } from './interfaces/model_capabilities.js';
import { MODEL_CAPABILITIES } from './constants/search_constants.js';
import aiServiceManager from './ai_service_manager.js';

/**
 * Service for fetching and caching model capabilities
 * Handles chat model capabilities
 */
export class ModelCapabilitiesService {
    // Cache model capabilities
    private capabilitiesCache: Map<string, ModelCapabilities> = new Map();

    /**
     * Get capabilities for a chat model
     */
    async getChatModelCapabilities(modelName: string): Promise<ModelCapabilities> {
        // Check cache first
        const cached = this.capabilitiesCache.get(`chat:${modelName}`);
        if (cached) {
            return cached;
        }

        // Get from static definitions or service
        const capabilities = await this.fetchChatModelCapabilities(modelName);

        // Cache the result
        this.capabilitiesCache.set(`chat:${modelName}`, capabilities);

        return capabilities;
    }

    /**
     * Fetch chat model capabilities from AI service or static definitions
     */
    private async fetchChatModelCapabilities(modelName: string): Promise<ModelCapabilities> {
        try {
            // Try to get from static definitions first
            const staticCapabilities = MODEL_CAPABILITIES[modelName.toLowerCase()];
            if (staticCapabilities) {
                log.info(`Using static capabilities for chat model: ${modelName}`);
                // Merge partial capabilities with defaults
                return {
                    ...DEFAULT_MODEL_CAPABILITIES,
                    ...staticCapabilities
                };
            }

            // AI service doesn't have getModelCapabilities method
            // Use default capabilities instead
            log.info(`AI service doesn't support model capabilities - using defaults for model: ${modelName}`);

            // Fallback to default capabilities
            log.info(`Using default capabilities for chat model: ${modelName}`);
            return DEFAULT_MODEL_CAPABILITIES;
        } catch (error) {
            log.error(`Error fetching capabilities for chat model ${modelName}: ${error}`);
            return DEFAULT_MODEL_CAPABILITIES;
        }
    }

    /**
     * Clear capabilities cache
     */
    clearCache(): void {
        this.capabilitiesCache.clear();
        log.info('Model capabilities cache cleared');
    }

    /**
     * Get all cached capabilities
     */
    getCachedCapabilities(): Record<string, ModelCapabilities> {
        const result: Record<string, ModelCapabilities> = {};
        for (const [key, value] of this.capabilitiesCache.entries()) {
            result[key] = value;
        }
        return result;
    }
}

// Export singleton instance
export const modelCapabilitiesService = new ModelCapabilitiesService();
export default modelCapabilitiesService;
