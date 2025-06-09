import { t } from "../../../../services/i18n.js";

export const TPL = `
<div class="options-section">
    <h4>${t("ai_llm.title")}</h4>

    <!-- Add warning alert div -->
    <div class="provider-validation-warning alert alert-warning" style="display: none;"></div>

    <div class="form-group">
        <label class="tn-checkbox">
            <input class="ai-enabled form-check-input" type="checkbox">
            ${t("ai_llm.enable_ai_features")}
        </label>
        <div class="form-text">${t("ai_llm.enable_ai_description")}</div>
    </div>
</div>

<!-- AI settings template -->

<div class="ai-providers-section options-section">
    <h4>${t("ai_llm.provider_configuration")}</h4>

    <div class="form-group">
        <label>${t("ai_llm.selected_provider")}</label>
        <select class="ai-selected-provider form-control">
            <option value="">${t("ai_llm.select_provider")}</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama</option>
        </select>
        <div class="form-text">${t("ai_llm.selected_provider_description")}</div>
    </div>

    <!-- OpenAI Provider Settings -->
    <div class="provider-settings openai-provider-settings" style="display: none;">
        <div class="card mt-3">
            <div class="card-header">
                <h5>${t("ai_llm.openai_settings")}</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>${t("ai_llm.api_key")}</label>
                    <input type="password" class="openai-api-key form-control" autocomplete="off" />
                    <div class="form-text">${t("ai_llm.openai_api_key_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.url")}</label>
                    <input type="text" class="openai-base-url form-control" />
                    <div class="form-text">${t("ai_llm.openai_url_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.model")}</label>
                    <select class="openai-default-model form-control">
                        <option value="">${t("ai_llm.select_model")}</option>
                    </select>
                    <div class="form-text">${t("ai_llm.openai_model_description")}</div>
                    <button class="btn btn-sm btn-outline-secondary refresh-openai-models">${t("ai_llm.refresh_models")}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Anthropic Provider Settings -->
    <div class="provider-settings anthropic-provider-settings" style="display: none;">
        <div class="card mt-3">
            <div class="card-header">
                <h5>${t("ai_llm.anthropic_settings")}</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>${t("ai_llm.api_key")}</label>
                    <input type="password" class="anthropic-api-key form-control" autocomplete="off" />
                    <div class="form-text">${t("ai_llm.anthropic_api_key_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.url")}</label>
                    <input type="text" class="anthropic-base-url form-control" />
                    <div class="form-text">${t("ai_llm.anthropic_url_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.model")}</label>
                    <select class="anthropic-default-model form-control">
                        <option value="">${t("ai_llm.select_model")}</option>
                    </select>
                    <div class="form-text">${t("ai_llm.anthropic_model_description")}</div>
                    <button class="btn btn-sm btn-outline-secondary refresh-anthropic-models">${t("ai_llm.refresh_models")}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Ollama Provider Settings -->
    <div class="provider-settings ollama-provider-settings" style="display: none;">
        <div class="card mt-3">
            <div class="card-header">
                <h5>${t("ai_llm.ollama_settings")}</h5>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label>${t("ai_llm.url")}</label>
                    <input type="text" class="ollama-base-url form-control" />
                    <div class="form-text">${t("ai_llm.ollama_url_description")}</div>
                </div>

                <div class="form-group">
                    <label>${t("ai_llm.model")}</label>
                    <select class="ollama-default-model form-control">
                        <option value="">${t("ai_llm.select_model")}</option>
                    </select>
                    <div class="form-text">${t("ai_llm.ollama_model_description")}</div>
                    <button class="btn btn-sm btn-outline-secondary refresh-models"><span class="bx bx-refresh"></span></button>
                </div>
            </div>
        </div>
    </div>

    <div class="form-group">
        <label>${t("ai_llm.temperature")}</label>
        <input class="ai-temperature form-control" type="number" min="0" max="2" step="0.1">
        <div class="form-text">${t("ai_llm.temperature_description")}</div>
    </div>

    <div class="form-group">
        <label>${t("ai_llm.system_prompt")}</label>
        <textarea class="ai-system-prompt form-control" rows="3"></textarea>
        <div class="form-text">${t("ai_llm.system_prompt_description")}</div>
    </div>
</div>

`;
