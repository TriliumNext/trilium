import options from "../../services/options.js";
import log from "../../services/log.js";
import type { Request, Response } from "express";
import { PROVIDER_CONSTANTS } from '../../services/llm/constants/provider_constants.js';
import Anthropic from '@anthropic-ai/sdk';

// Interface for Anthropic model entries
interface AnthropicModel {
    id: string;
    name: string;
    type: string;
}

/**
 * @swagger
 * /api/anthropic/models:
 *   post:
 *     summary: List available models from Anthropic
 *     operationId: anthropic-list-models
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseUrl:
 *                 type: string
 *                 description: Optional custom Anthropic API base URL
 *     responses:
 *       '200':
 *         description: List of available Anthropic models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chatModels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *       '500':
 *         description: Error listing models
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function listModels(req: Request, res: Response) {
    try {
        const { baseUrl } = req.body;

        // Use provided base URL or default from options
        const anthropicBaseUrl = baseUrl ||
            await options.getOption('anthropicBaseUrl') ||
            PROVIDER_CONSTANTS.ANTHROPIC.BASE_URL;

        const apiKey = await options.getOption('anthropicApiKey');

        if (!apiKey) {
            throw new Error('Anthropic API key is not configured');
        }

        log.info(`Using predefined Anthropic models list (avoiding direct API call)`);

        // Instead of using the SDK's built-in models listing which might not work,
        // directly use the predefined available models
        const chatModels = PROVIDER_CONSTANTS.ANTHROPIC.AVAILABLE_MODELS.map(model => ({
            id: model.id,
            name: model.name,
            type: 'chat'
        }));

        // Return the models list
        return {
            success: true,
            chatModels
        };
    } catch (error: any) {
        log.error(`Error listing Anthropic models: ${error.message || 'Unknown error'}`);

        // Properly throw the error to be handled by the global error handler
        throw new Error(`Failed to list Anthropic models: ${error.message || 'Unknown error'}`);
    }
}

export default {
    listModels
};
