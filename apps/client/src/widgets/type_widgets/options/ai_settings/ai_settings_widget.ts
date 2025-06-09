import OptionsWidget from "../options_widget.js";
import { TPL } from "./template.js";
import { t } from "../../../../services/i18n.js";
import type { OptionDefinitions, OptionMap } from "@triliumnext/commons";
import server from "../../../../services/server.js";
import toastService from "../../../../services/toast.js";
import { ProviderService } from "./providers.js";

export default class AiSettingsWidget extends OptionsWidget {
    private ollamaModelsRefreshed = false;
    private openaiModelsRefreshed = false;
    private anthropicModelsRefreshed = false;
    private providerService: ProviderService | null = null;

    doRender() {
        this.$widget = $(TPL);
        this.providerService = new ProviderService(this.$widget);

        // Setup event handlers for options
        this.setupEventHandlers();

        return this.$widget;
    }

    /**
     * Helper method to set up a change event handler for an option
     * @param selector The jQuery selector for the element
     * @param optionName The name of the option to update
     * @param validateAfter Whether to run validation after the update
     * @param isCheckbox Whether the element is a checkbox
     */
    setupChangeHandler(selector: string, optionName: keyof OptionDefinitions, validateAfter: boolean = false, isCheckbox: boolean = false) {
        if (!this.$widget) return;

        const $element = this.$widget.find(selector);
        $element.on('change', async () => {
            let value: string;

            if (isCheckbox) {
                value = $element.prop('checked') ? 'true' : 'false';
            } else {
                value = $element.val() as string;
            }

            await this.updateOption(optionName, value);

            // Special handling for aiEnabled option
            if (optionName === 'aiEnabled') {
                try {
                    const isEnabled = value === 'true';

                    if (isEnabled) {
                        toastService.showMessage(t("ai_llm.ai_enabled") || "AI features enabled");
                    } else {
                        toastService.showMessage(t("ai_llm.ai_disabled") || "AI features disabled");
                    }
                } catch (error) {
                    console.error('Error toggling AI:', error);
                    toastService.showError(t("ai_llm.ai_toggle_error") || "Error toggling AI features");
                }
            }

            if (validateAfter) {
                await this.displayValidationWarnings();
            }
        });
    }

    /**
     * Set up all event handlers for options
     */
    setupEventHandlers() {
        if (!this.$widget) return;

        // Core AI options
        this.setupChangeHandler('.ai-enabled', 'aiEnabled', true, true);
        this.setupChangeHandler('.ai-selected-provider', 'aiSelectedProvider', true);
        this.setupChangeHandler('.ai-temperature', 'aiTemperature');
        this.setupChangeHandler('.ai-system-prompt', 'aiSystemPrompt');

        // OpenAI options
        this.setupChangeHandler('.openai-api-key', 'openaiApiKey', true);
        this.setupChangeHandler('.openai-base-url', 'openaiBaseUrl', true);
        this.setupChangeHandler('.openai-default-model', 'openaiDefaultModel');

        // Anthropic options
        this.setupChangeHandler('.anthropic-api-key', 'anthropicApiKey', true);
        this.setupChangeHandler('.anthropic-default-model', 'anthropicDefaultModel');
        this.setupChangeHandler('.anthropic-base-url', 'anthropicBaseUrl');

        // Voyage options
        this.setupChangeHandler('.voyage-api-key', 'voyageApiKey');

        // Ollama options
        this.setupChangeHandler('.ollama-base-url', 'ollamaBaseUrl');
        this.setupChangeHandler('.ollama-default-model', 'ollamaDefaultModel');

        const $refreshModels = this.$widget.find('.refresh-models');
        $refreshModels.on('click', async () => {
            this.ollamaModelsRefreshed = await this.providerService?.refreshOllamaModels(true, this.ollamaModelsRefreshed) || false;
        });

        // Add tab change handler for Ollama tab
        const $ollamaTab = this.$widget.find('#nav-ollama-tab');
        $ollamaTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.ollamaModelsRefreshed = await this.providerService?.refreshOllamaModels(false, this.ollamaModelsRefreshed) || false;
        });

        // OpenAI models refresh button
        const $refreshOpenAIModels = this.$widget.find('.refresh-openai-models');
        $refreshOpenAIModels.on('click', async () => {
            this.openaiModelsRefreshed = await this.providerService?.refreshOpenAIModels(true, this.openaiModelsRefreshed) || false;
        });

        // Add tab change handler for OpenAI tab
        const $openaiTab = this.$widget.find('#nav-openai-tab');
        $openaiTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.openaiModelsRefreshed = await this.providerService?.refreshOpenAIModels(false, this.openaiModelsRefreshed) || false;
        });

        // Anthropic models refresh button
        const $refreshAnthropicModels = this.$widget.find('.refresh-anthropic-models');
        $refreshAnthropicModels.on('click', async () => {
            this.anthropicModelsRefreshed = await this.providerService?.refreshAnthropicModels(true, this.anthropicModelsRefreshed) || false;
        });

        // Add tab change handler for Anthropic tab
        const $anthropicTab = this.$widget.find('#nav-anthropic-tab');
        $anthropicTab.on('shown.bs.tab', async () => {
            // Only refresh the models if we haven't done it before
            this.anthropicModelsRefreshed = await this.providerService?.refreshAnthropicModels(false, this.anthropicModelsRefreshed) || false;
        });


        // Add provider selection change handlers for dynamic settings visibility
        this.$widget.find('.ai-selected-provider').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            this.$widget.find('.provider-settings').hide();
            if (selectedProvider) {
                this.$widget.find(`.${selectedProvider}-provider-settings`).show();
                // Automatically fetch models for the newly selected provider
                await this.fetchModelsForProvider(selectedProvider, 'chat');
            }
        });


        // Add base URL change handlers to trigger model fetching
        this.$widget.find('.openai-base-url').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            if (selectedProvider === 'openai') {
                await this.fetchModelsForProvider('openai', 'chat');
            }
        });

        this.$widget.find('.anthropic-base-url').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            if (selectedProvider === 'anthropic') {
                await this.fetchModelsForProvider('anthropic', 'chat');
            }
        });

        this.$widget.find('.ollama-base-url').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            if (selectedProvider === 'ollama') {
                await this.fetchModelsForProvider('ollama', 'chat');
            }
        });

        // Add API key change handlers to trigger model fetching
        this.$widget.find('.openai-api-key').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            if (selectedProvider === 'openai') {
                await this.fetchModelsForProvider('openai', 'chat');
            }
        });

        this.$widget.find('.anthropic-api-key').on('change', async () => {
            const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;
            if (selectedProvider === 'anthropic') {
                await this.fetchModelsForProvider('anthropic', 'chat');
            }
        });

    }

    /**
     * Display warnings for validation issues with providers
     */
    async displayValidationWarnings() {
        if (!this.$widget) return;

        const $warningDiv = this.$widget.find('.provider-validation-warning');

        // Check if AI is enabled
        const aiEnabled = this.$widget.find('.ai-enabled').prop('checked');
        if (!aiEnabled) {
            $warningDiv.hide();
            return;
        }

        // Get selected provider
        const selectedProvider = this.$widget.find('.ai-selected-provider').val() as string;

        // Start with experimental warning
        const allWarnings = [
            t("ai_llm.experimental_warning")
        ];

        // Check for selected provider configuration
        const providerWarnings: string[] = [];
        if (selectedProvider === 'openai') {
            const openaiApiKey = this.$widget.find('.openai-api-key').val();
            if (!openaiApiKey) {
                providerWarnings.push(t("ai_llm.empty_key_warning.openai"));
            }
        } else if (selectedProvider === 'anthropic') {
            const anthropicApiKey = this.$widget.find('.anthropic-api-key').val();
            if (!anthropicApiKey) {
                providerWarnings.push(t("ai_llm.empty_key_warning.anthropic"));
            }
        } else if (selectedProvider === 'ollama') {
            const ollamaBaseUrl = this.$widget.find('.ollama-base-url').val();
            if (!ollamaBaseUrl) {
                providerWarnings.push(t("ai_llm.ollama_no_url"));
            }
        }

        // Add provider warnings to all warnings
        allWarnings.push(...providerWarnings);

        // Show or hide warnings
        if (allWarnings.length > 0) {
            const warningHtml = '<strong>' + t("ai_llm.configuration_warnings") + '</strong><ul>' +
                allWarnings.map(warning => `<li>${warning}</li>`).join('') + '</ul>';
            $warningDiv.html(warningHtml).show();
        } else {
            $warningDiv.hide();
        }
    }


    /**
     * Helper to get display name for providers
     */
    getProviderDisplayName(provider: string): string {
        switch(provider) {
            case 'openai': return 'OpenAI';
            case 'anthropic': return 'Anthropic';
            case 'ollama': return 'Ollama';
            case 'voyage': return 'Voyage';
            case 'local': return 'Local';
            default: return provider.charAt(0).toUpperCase() + provider.slice(1);
        }
    }

    /**
     * Set model dropdown value, adding the option if it doesn't exist
     */
    setModelDropdownValue(selector: string, value: string | undefined) {
        if (!this.$widget || !value) return;

        const $dropdown = this.$widget.find(selector);

        // Check if the value already exists as an option
        if ($dropdown.find(`option[value="${value}"]`).length === 0) {
            // Add the custom value as an option
            $dropdown.append(`<option value="${value}">${value} (current)</option>`);
        }

        // Set the value
        $dropdown.val(value);
    }

    /**
     * Fetch models for a specific provider and model type
     */
    async fetchModelsForProvider(provider: string, modelType: 'chat') {
        if (!this.providerService) return;

        try {
            switch (provider) {
                case 'openai':
                    this.openaiModelsRefreshed = await this.providerService.refreshOpenAIModels(false, this.openaiModelsRefreshed);
                    break;
                case 'anthropic':
                    this.anthropicModelsRefreshed = await this.providerService.refreshAnthropicModels(false, this.anthropicModelsRefreshed);
                    break;
                case 'ollama':
                    this.ollamaModelsRefreshed = await this.providerService.refreshOllamaModels(false, this.ollamaModelsRefreshed);
                    break;
                default:
                    console.log(`Model fetching not implemented for provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error fetching models for ${provider}:`, error);
        }
    }

    /**
     * Update provider settings visibility based on selected providers
     */
    updateProviderSettingsVisibility() {
        if (!this.$widget) return;

        // Update AI provider settings visibility
        const selectedAiProvider = this.$widget.find('.ai-selected-provider').val() as string;
        this.$widget.find('.provider-settings').hide();
        if (selectedAiProvider) {
            this.$widget.find(`.${selectedAiProvider}-provider-settings`).show();
        }

    }

    /**
     * Called when the options have been loaded from the server
     */
    async optionsLoaded(options: OptionMap) {
        if (!this.$widget) return;

        // AI Options
        this.$widget.find('.ai-enabled').prop('checked', options.aiEnabled !== 'false');
        this.$widget.find('.ai-temperature').val(options.aiTemperature || '0.7');
        this.$widget.find('.ai-system-prompt').val(options.aiSystemPrompt || '');
        this.$widget.find('.ai-selected-provider').val(options.aiSelectedProvider || 'openai');

        // OpenAI Section
        this.$widget.find('.openai-api-key').val(options.openaiApiKey || '');
        this.$widget.find('.openai-base-url').val(options.openaiBaseUrl || 'https://api.openai.com/v1');
        this.setModelDropdownValue('.openai-default-model', options.openaiDefaultModel);

        // Anthropic Section
        this.$widget.find('.anthropic-api-key').val(options.anthropicApiKey || '');
        this.$widget.find('.anthropic-base-url').val(options.anthropicBaseUrl || 'https://api.anthropic.com');
        this.setModelDropdownValue('.anthropic-default-model', options.anthropicDefaultModel);

        // Voyage Section
        this.$widget.find('.voyage-api-key').val(options.voyageApiKey || '');

        // Ollama Section
        this.$widget.find('.ollama-base-url').val(options.ollamaBaseUrl || 'http://localhost:11434');
        this.setModelDropdownValue('.ollama-default-model', options.ollamaDefaultModel);

        // Show/hide provider settings based on selected providers
        this.updateProviderSettingsVisibility();

        // Automatically fetch models for currently selected providers
        const selectedAiProvider = this.$widget.find('.ai-selected-provider').val() as string;

        if (selectedAiProvider) {
            await this.fetchModelsForProvider(selectedAiProvider, 'chat');
        }

        // Display validation warnings
        this.displayValidationWarnings();
    }

    cleanup() {
        // Cleanup method for widget
    }
}
