import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import { t } from "../../../../services/i18n.js";
import options from "../../../../services/options.js";
import type { OpenAIModelResponse, AnthropicModelResponse, OllamaModelResponse } from "./interfaces.js";

export class ProviderService {
    constructor(private $widget: JQuery<HTMLElement>) {
        // AI provider settings
    }

    /**
     * Ensures the dropdown has the correct value set, prioritizing:
     * 1. Current UI value if present
     * 2. Value from database options if available
     * 3. Falling back to first option if neither is available
     */
    private ensureSelectedValue($select: JQuery<HTMLElement>, currentValue: string | number | string[] | undefined | null, optionName: string) {
        if (currentValue) {
            $select.val(currentValue);
            // If the value doesn't exist anymore, select the first option
            if (!$select.val()) {
                $select.prop('selectedIndex', 0);
            }
        } else {
            // If no current value exists in the dropdown but there's a default in the database
            const savedModel = options.get(optionName);
            if (savedModel) {
                $select.val(savedModel);
                // If the saved model isn't in the dropdown, select the first option
                if (!$select.val()) {
                    $select.prop('selectedIndex', 0);
                }
            }
        }
    }

    /**
     * Refreshes the list of OpenAI models
     * @param showLoading Whether to show loading indicators and toasts
     * @param openaiModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshOpenAIModels(showLoading: boolean, openaiModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;

        const $refreshOpenAIModels = this.$widget.find('.refresh-openai-models');

        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (openaiModelsRefreshed && !showLoading) {
            return openaiModelsRefreshed;
        }

        if (showLoading) {
            $refreshOpenAIModels.prop('disabled', true);
            $refreshOpenAIModels.html(`<i class="spinner-border spinner-border-sm"></i>`);
        }

        try {
            const openaiBaseUrl = this.$widget.find('.openai-base-url').val() as string;
            const response = await server.get<OpenAIModelResponse>(`llm/providers/openai/models?baseUrl=${encodeURIComponent(openaiBaseUrl)}`);

            if (response && response.success) {
                // Update the chat models dropdown
                if (response.chatModels?.length > 0) {
                    const $chatModelSelect = this.$widget.find('.openai-default-model');
                    const currentChatValue = $chatModelSelect.val();

                    // Clear existing options
                    $chatModelSelect.empty();

                    // Sort models by name
                    const sortedChatModels = [...response.chatModels].sort((a, b) => a.name.localeCompare(b.name));

                    // Add models to the dropdown
                    sortedChatModels.forEach(model => {
                        $chatModelSelect.append(`<option value="${model.id}">${model.name}</option>`);
                    });

                    // Try to restore the previously selected value
                    this.ensureSelectedValue($chatModelSelect, currentChatValue, 'openaiDefaultModel');
                }


                if (showLoading) {
                    // Show success message
                    const totalModels = (response.chatModels?.length || 0);
                    toastService.showMessage(`${totalModels} OpenAI models found.`);
                }

                return true;
            } else if (showLoading) {
                toastService.showError(`No OpenAI models found. Please check your API key and settings.`);
            }

            return openaiModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching OpenAI models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching OpenAI models: ${e}`);
            }
            return openaiModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshOpenAIModels.prop('disabled', false);
                $refreshOpenAIModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }

    /**
     * Refreshes the list of Anthropic models
     * @param showLoading Whether to show loading indicators and toasts
     * @param anthropicModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshAnthropicModels(showLoading: boolean, anthropicModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;

        const $refreshAnthropicModels = this.$widget.find('.refresh-anthropic-models');

        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (anthropicModelsRefreshed && !showLoading) {
            return anthropicModelsRefreshed;
        }

        if (showLoading) {
            $refreshAnthropicModels.prop('disabled', true);
            $refreshAnthropicModels.html(`<i class="spinner-border spinner-border-sm"></i>`);
        }

        try {
            const anthropicBaseUrl = this.$widget.find('.anthropic-base-url').val() as string;
            const response = await server.get<AnthropicModelResponse>(`llm/providers/anthropic/models?baseUrl=${encodeURIComponent(anthropicBaseUrl)}`);

            if (response && response.success) {
                // Update the chat models dropdown
                if (response.chatModels?.length > 0) {
                    const $chatModelSelect = this.$widget.find('.anthropic-default-model');
                    const currentChatValue = $chatModelSelect.val();

                    // Clear existing options
                    $chatModelSelect.empty();

                    // Sort models by name
                    const sortedChatModels = [...response.chatModels].sort((a, b) => a.name.localeCompare(b.name));

                    // Add models to the dropdown
                    sortedChatModels.forEach(model => {
                        $chatModelSelect.append(`<option value="${model.id}">${model.name}</option>`);
                    });

                    // Try to restore the previously selected value
                    this.ensureSelectedValue($chatModelSelect, currentChatValue, 'anthropicDefaultModel');
                }

                if (showLoading) {
                    // Show success message
                    const totalModels = (response.chatModels?.length || 0);
                    toastService.showMessage(`${totalModels} Anthropic models found.`);
                }

                return true;
            } else if (showLoading) {
                toastService.showError(`No Anthropic models found. Please check your API key and settings.`);
            }

            return anthropicModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching Anthropic models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching Anthropic models: ${e}`);
            }
            return anthropicModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshAnthropicModels.prop('disabled', false);
                $refreshAnthropicModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }

    /**
     * Refreshes the list of Ollama models
     * @param showLoading Whether to show loading indicators and toasts
     * @param ollamaModelsRefreshed Reference to track if models have been refreshed
     * @returns Promise that resolves when the refresh is complete
     */
    async refreshOllamaModels(showLoading: boolean, ollamaModelsRefreshed: boolean): Promise<boolean> {
        if (!this.$widget) return false;

        const $refreshModels = this.$widget.find('.refresh-models');

        // If we've already refreshed and we're not forcing a refresh, don't do it again
        if (ollamaModelsRefreshed && !showLoading) {
            return ollamaModelsRefreshed;
        }

        if (showLoading) {
            $refreshModels.prop('disabled', true);
            $refreshModels.text(t("ai_llm.refreshing_models"));
        }

        try {
            // Use the general Ollama base URL
            const ollamaBaseUrl = this.$widget.find('.ollama-base-url').val() as string;

            const response = await server.get<OllamaModelResponse>(`llm/providers/ollama/models?baseUrl=${encodeURIComponent(ollamaBaseUrl)}`);

            if (response && response.success && response.models && response.models.length > 0) {
                // Update the LLM model dropdown
                const $modelSelect = this.$widget.find('.ollama-default-model');
                const currentModelValue = $modelSelect.val();

                // Clear existing options
                $modelSelect.empty();

                // Sort models by name to make them easier to find
                const sortedModels = [...response.models].sort((a, b) => a.name.localeCompare(b.name));

                // Add all models to the dropdown
                sortedModels.forEach(model => {
                    $modelSelect.append(`<option value="${model.name}">${model.name}</option>`);
                });

                // Try to restore the previously selected value
                this.ensureSelectedValue($modelSelect, currentModelValue, 'ollamaDefaultModel');

                if (showLoading) {
                    toastService.showMessage(`${response.models.length} Ollama models found.`);
                }

                return true;
            } else if (showLoading) {
                toastService.showError(`No Ollama models found. Please check if Ollama is running.`);
            }

            return ollamaModelsRefreshed;
        } catch (e) {
            console.error(`Error fetching Ollama models:`, e);
            if (showLoading) {
                toastService.showError(`Error fetching Ollama models: ${e}`);
            }
            return ollamaModelsRefreshed;
        } finally {
            if (showLoading) {
                $refreshModels.prop('disabled', false);
                $refreshModels.html(`<span class="bx bx-refresh"></span>`);
            }
        }
    }
}
