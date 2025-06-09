// Interface for the Ollama model response
export interface OllamaModelResponse {
    success: boolean;
    models: Array<{
        name: string;
        model: string;
        details?: {
            family?: string;
            parameter_size?: string;
        }
    }>;
}


export interface OpenAIModelResponse {
    success: boolean;
    chatModels: Array<{
        id: string;
        name: string;
        type: string;
    }>;
}

export interface AnthropicModelResponse {
    success: boolean;
    chatModels: Array<{
        id: string;
        name: string;
        type: string;
    }>;
}