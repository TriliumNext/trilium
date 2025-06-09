import type { Request, Response } from "express";
import log from "../../services/log.js";
import options from "../../services/options.js";

import restChatService from "../../services/llm/rest_chat_service.js";
import chatStorageService from '../../services/llm/chat_storage_service.js';

// Define basic interfaces
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}



/**
 * @swagger
 * /api/llm/sessions:
 *   post:
 *     summary: Create a new LLM chat session
 *     operationId: llm-create-session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title for the chat session
 *               systemPrompt:
 *                 type: string
 *                 description: System message to set the behavior of the assistant
 *               temperature:
 *                 type: number
 *                 description: Temperature parameter for the LLM (0.0-1.0)
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum tokens to generate in responses
 *               model:
 *                 type: string
 *                 description: Specific model to use (depends on provider)
 *               provider:
 *                 type: string
 *                 description: LLM provider to use (e.g., 'openai', 'anthropic', 'ollama')
 *               contextNoteId:
 *                 type: string
 *                 description: Note ID to use as context for the session
 *     responses:
 *       '200':
 *         description: Successfully created session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 title:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function createSession(req: Request, res: Response) {
    return restChatService.createSession(req, res);
}

/**
 * @swagger
 * /api/llm/sessions/{sessionId}:
 *   get:
 *     summary: Retrieve a specific chat session
 *     operationId: llm-get-session
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Chat session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [user, assistant, system]
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 lastActive:
 *                   type: string
 *                   format: date-time
 *       '404':
 *         description: Session not found
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function getSession(req: Request, res: Response) {
    return restChatService.getSession(req, res);
}

/**
 * @swagger
 * /api/llm/chat/{chatNoteId}:
 *   patch:
 *     summary: Update a chat's settings
 *     operationId: llm-update-chat
 *     parameters:
 *       - name: chatNoteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat note (formerly sessionId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated title for the session
 *               systemPrompt:
 *                 type: string
 *                 description: Updated system prompt
 *               temperature:
 *                 type: number
 *                 description: Updated temperature setting
 *               maxTokens:
 *                 type: integer
 *                 description: Updated maximum tokens setting
 *               model:
 *                 type: string
 *                 description: Updated model selection
 *               provider:
 *                 type: string
 *                 description: Updated provider selection
 *               contextNoteId:
 *                 type: string
 *                 description: Updated note ID for context
 *     responses:
 *       '200':
 *         description: Session successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       '404':
 *         description: Session not found
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function updateSession(req: Request, res: Response) {
    // Get the chat using chatStorageService directly
    const chatNoteId = req.params.chatNoteId;
    const updates = req.body;

    try {
        // Get the chat
        const chat = await chatStorageService.getChat(chatNoteId);
        if (!chat) {
            throw new Error(`Chat with ID ${chatNoteId} not found`);
        }

        // Update title if provided
        if (updates.title) {
            await chatStorageService.updateChat(chatNoteId, chat.messages, updates.title);
        }

        // Return the updated chat
        return {
            id: chatNoteId,
            title: updates.title || chat.title,
            updatedAt: new Date()
        };
    } catch (error) {
        log.error(`Error updating chat: ${error}`);
        throw new Error(`Failed to update chat: ${error}`);
    }
}

/**
 * @swagger
 * /api/llm/sessions:
 *   get:
 *     summary: List all chat sessions
 *     operationId: llm-list-sessions
 *     responses:
 *       '200':
 *         description: List of chat sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   lastActive:
 *                     type: string
 *                     format: date-time
 *                   messageCount:
 *                     type: integer
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function listSessions(req: Request, res: Response) {
    // Get all sessions using chatStorageService directly
    try {
        const chats = await chatStorageService.getAllChats();

        // Format the response
        return {
            sessions: chats.map(chat => ({
                id: chat.id,
                title: chat.title,
                createdAt: chat.createdAt || new Date(),
                lastActive: chat.updatedAt || new Date(),
                messageCount: chat.messages.length
            }))
        };
    } catch (error) {
        log.error(`Error listing sessions: ${error}`);
        throw new Error(`Failed to list sessions: ${error}`);
    }
}

/**
 * @swagger
 * /api/llm/sessions/{sessionId}:
 *   delete:
 *     summary: Delete a chat session
 *     operationId: llm-delete-session
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Session successfully deleted
 *       '404':
 *         description: Session not found
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function deleteSession(req: Request, res: Response) {
    return restChatService.deleteSession(req, res);
}

/**
 * @swagger
 * /api/llm/chat/{chatNoteId}/messages:
 *   post:
 *     summary: Send a message to an LLM and get a response
 *     operationId: llm-send-message
 *     parameters:
 *       - name: chatNoteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat note (formerly sessionId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user message to send to the LLM
 *               options:
 *                 type: object
 *                 description: Optional parameters for this specific message
 *                 properties:
 *                   temperature:
 *                     type: number
 *                   maxTokens:
 *                     type: integer
 *                   model:
 *                     type: string
 *                   provider:
 *                     type: string
 *               includeContext:
 *                 type: boolean
 *                 description: Whether to include relevant notes as context
 *               useNoteContext:
 *                 type: boolean
 *                 description: Whether to use the session's context note
 *     responses:
 *       '200':
 *         description: LLM response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       noteId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       similarity:
 *                         type: number
 *                 sessionId:
 *                   type: string
 *       '404':
 *         description: Session not found
 *       '500':
 *         description: Error processing request
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function sendMessage(req: Request, res: Response) {
    return restChatService.handleSendMessage(req, res);
}









/**
 * @swagger
 * /api/llm/chat/{chatNoteId}/messages/stream:
 *   post:
 *     summary: Stream a message to an LLM via WebSocket
 *     operationId: llm-stream-message
 *     parameters:
 *       - name: chatNoteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat note to stream messages to (formerly sessionId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The user message to send to the LLM
 *               useAdvancedContext:
 *                 type: boolean
 *                 description: Whether to use advanced context extraction
 *               showThinking:
 *                 type: boolean
 *                 description: Whether to show thinking process in the response
 *     responses:
 *       '200':
 *         description: Streaming started successfully
 *       '404':
 *         description: Session not found
 *       '500':
 *         description: Error processing request
 *     security:
 *       - session: []
 *     tags: ["llm"]
 */
async function streamMessage(req: Request, res: Response) {
    log.info("=== Starting streamMessage ===");
    try {
        const chatNoteId = req.params.chatNoteId;
        const { content, useAdvancedContext, showThinking, mentions } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Content cannot be empty'
            });
        }
        
        // IMPORTANT: Immediately send a success response to the initial POST request
        // The client is waiting for this to confirm streaming has been initiated
        res.status(200).json({
            success: true,
            message: 'Streaming initiated successfully'
        });
        
        // Mark response as handled to prevent apiResultHandler from processing it again
        (res as any).triliumResponseHandled = true;
        
        
        // Create a new response object for streaming through WebSocket only
        // We won't use HTTP streaming since we've already sent the HTTP response

        // Get or create chat directly from storage (simplified approach)
        let chat = await chatStorageService.getChat(chatNoteId);
        if (!chat) {
            // Create a new chat if it doesn't exist
            chat = await chatStorageService.createChat('New Chat');
            log.info(`Created new chat with ID: ${chat.id} for stream request`);
        }
        
        // Add the user message to the chat immediately
        chat.messages.push({
            role: 'user',
            content
        });
        // Save the chat to ensure the user message is recorded
        await chatStorageService.updateChat(chat.id, chat.messages, chat.title);

        // Process mentions if provided
        let enhancedContent = content;
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            log.info(`Processing ${mentions.length} note mentions`);

            // Import note service to get note content
            const becca = (await import('../../becca/becca.js')).default;
            const mentionContexts: string[] = [];

            for (const mention of mentions) {
                try {
                    const note = becca.getNote(mention.noteId);
                    if (note && !note.isDeleted) {
                        const noteContent = note.getContent();
                        if (noteContent && typeof noteContent === 'string' && noteContent.trim()) {
                            mentionContexts.push(`\n\n--- Content from "${mention.title}" (${mention.noteId}) ---\n${noteContent}\n--- End of "${mention.title}" ---`);
                            log.info(`Added content from note "${mention.title}" (${mention.noteId})`);
                        }
                    } else {
                        log.info(`Referenced note not found or deleted: ${mention.noteId}`);
                    }
                } catch (error) {
                    log.error(`Error retrieving content for note ${mention.noteId}: ${error}`);
                }
            }

            // Enhance the content with note references
            if (mentionContexts.length > 0) {
                enhancedContent = `${content}\n\n=== Referenced Notes ===\n${mentionContexts.join('\n')}`;
                log.info(`Enhanced content with ${mentionContexts.length} note references`);
            }
        }

        // Import the WebSocket service to send immediate feedback
        const wsService = (await import('../../services/ws.js')).default;

        // Let the client know streaming has started
        wsService.sendMessageToAllClients({
            type: 'llm-stream',
            chatNoteId: chatNoteId,
            thinking: showThinking ? 'Initializing streaming LLM response...' : undefined
        });

        // Process the LLM request using the existing service but with streaming setup
        // Since we've already sent the initial HTTP response, we'll use the WebSocket for streaming
        try {
            // Call restChatService with streaming mode enabled
            // The important part is setting method to GET to indicate streaming mode
            await restChatService.handleSendMessage({
                ...req,
                method: 'GET', // Indicate streaming mode
                query: {
                    ...req.query,
                    stream: 'true' // Add the required stream parameter
                },
                body: {
                    content: enhancedContent,
                    useAdvancedContext: useAdvancedContext === true,
                    showThinking: showThinking === true
                },
                params: { chatNoteId }
            } as unknown as Request, res);
        } catch (streamError) {
            log.error(`Error during WebSocket streaming: ${streamError}`);
            
            // Send error message through WebSocket
            wsService.sendMessageToAllClients({
                type: 'llm-stream',
                chatNoteId: chatNoteId,
                error: `Error during streaming: ${streamError}`,
                done: true
            });
        }
    } catch (error: any) {
        log.error(`Error starting message stream: ${error.message}`);
        log.error(`Error starting message stream, can't communicate via WebSocket: ${error.message}`);
    }
}

export default {
    // Chat session management
    createSession,
    getSession,
    updateSession,
    listSessions,
    deleteSession,
    sendMessage,
    streamMessage
};
