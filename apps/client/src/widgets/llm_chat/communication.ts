/**
 * Communication functions for LLM Chat
 */
import server from "../../services/server.js";
import type { SessionResponse } from "./types.js";

/**
 * Create a new chat session
 * @param currentNoteId - Optional current note ID for context
 * @returns The noteId of the created chat note
 */
export async function createChatSession(currentNoteId?: string): Promise<string | null> {
    try {
        const resp = await server.post<SessionResponse>('llm/chat', {
            title: 'Note Chat',
            currentNoteId: currentNoteId // Pass the current note ID if available
        });

        if (resp && resp.id) {
            // Backend returns the chat note ID as 'id'
            return resp.id;
        }
    } catch (error) {
        console.error('Failed to create chat session:', error);
    }

    return null;
}

/**
 * Check if a chat note exists
 * @param noteId - The ID of the chat note
 */
export async function checkSessionExists(noteId: string): Promise<boolean> {
    try {
        const sessionCheck = await server.getWithSilentNotFound<any>(`llm/chat/${noteId}`);
        return !!(sessionCheck && sessionCheck.id);
    } catch (error: any) {
        console.log(`Error checking chat note ${noteId}:`, error);
        return false;
    }
}

/**
 * Set up streaming response via WebSocket
 * @param noteId - The ID of the chat note
 * @param messageParams - Message parameters
 * @param onContentUpdate - Callback for content updates
 * @param onThinkingUpdate - Callback for thinking updates
 * @param onToolExecution - Callback for tool execution
 * @param onProgressUpdate - Callback for progress updates
 * @param onUserInteraction - Callback for user interaction requests
 * @param onErrorRecovery - Callback for error recovery options
 * @param onComplete - Callback for completion
 * @param onError - Callback for errors
 */
export async function setupStreamingResponse(
    noteId: string,
    messageParams: any,
    onContentUpdate: (content: string, isDone?: boolean) => void,
    onThinkingUpdate: (thinking: string) => void,
    onToolExecution: (toolData: any) => void,
    onProgressUpdate: (progressData: any) => void,
    onUserInteraction: (interactionData: any) => Promise<any>,
    onErrorRecovery: (errorData: any) => Promise<any>,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        let assistantResponse = '';
        let receivedAnyContent = false;
        let timeoutId: number | null = null;
        let initialTimeoutId: number | null = null;
        let cleanupTimeoutId: number | null = null;
        let heartbeatTimeoutId: number | null = null;
        let receivedAnyMessage = false;
        let eventListener: ((event: Event) => void) | null = null;
        let lastMessageTimestamp = 0;
        
        // Configuration for timeouts
        const HEARTBEAT_TIMEOUT_MS = 30000; // 30 seconds between messages
        const MAX_IDLE_TIME_MS = 60000; // 60 seconds max idle time

        // Create a unique identifier for this response process
        const responseId = `llm-stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log(`[${responseId}] Setting up WebSocket streaming for chat note ${noteId}`);

        // Send the initial request to initiate streaming
        (async () => {
            try {
                const streamResponse = await server.post<any>(`llm/chat/${noteId}/messages/stream`, {
                    content: messageParams.content,
                    useAdvancedContext: messageParams.useAdvancedContext,
                    showThinking: messageParams.showThinking,
                    options: {
                        temperature: 0.7,
                        maxTokens: 2000
                    }
                });

                if (!streamResponse || !streamResponse.success) {
                    console.error(`[${responseId}] Failed to initiate streaming`);
                    reject(new Error('Failed to initiate streaming'));
                    return;
                }

                console.log(`[${responseId}] Streaming initiated successfully`);
            } catch (error) {
                console.error(`[${responseId}] Error initiating streaming:`, error);
                reject(error);
                return;
            }
        })();

        // Function to reset heartbeat timeout
        const resetHeartbeatTimeout = () => {
            if (heartbeatTimeoutId) {
                window.clearTimeout(heartbeatTimeoutId);
            }
            
            heartbeatTimeoutId = window.setTimeout(() => {
                const idleTime = Date.now() - lastMessageTimestamp;
                console.warn(`[${responseId}] No message received for ${idleTime}ms`);
                
                if (idleTime > MAX_IDLE_TIME_MS) {
                    console.error(`[${responseId}] Connection appears to be stalled (idle for ${idleTime}ms)`);
                    performCleanup();
                    reject(new Error('Connection lost: The AI service stopped responding. Please try again.'));
                } else {
                    // Send a warning but continue waiting
                    console.warn(`[${responseId}] Connection may be slow, continuing to wait...`);
                    resetHeartbeatTimeout(); // Reset for another check
                }
            }, HEARTBEAT_TIMEOUT_MS);
        };

        // Function to safely perform cleanup
        const performCleanup = () => {
            // Clear all timeouts
            if (cleanupTimeoutId) {
                window.clearTimeout(cleanupTimeoutId);
                cleanupTimeoutId = null;
            }
            if (heartbeatTimeoutId) {
                window.clearTimeout(heartbeatTimeoutId);
                heartbeatTimeoutId = null;
            }
            if (initialTimeoutId) {
                window.clearTimeout(initialTimeoutId);
                initialTimeoutId = null;
            }

            console.log(`[${responseId}] Performing final cleanup of event listener`);
            cleanupEventListener(eventListener);
            onComplete();
            resolve();
        };

        // Set initial timeout to catch cases where no message is received at all
        // Increased timeout and better error messaging
        const INITIAL_TIMEOUT_MS = 15000; // 15 seconds for initial response
        initialTimeoutId = window.setTimeout(() => {
            if (!receivedAnyMessage) {
                console.error(`[${responseId}] No initial message received within ${INITIAL_TIMEOUT_MS}ms timeout`);
                performCleanup();
                reject(new Error('Connection timeout: The AI service is taking longer than expected to respond. Please check your connection and try again.'));
            }
        }, INITIAL_TIMEOUT_MS);

        // Create a message handler for CustomEvents
        eventListener = (event: Event) => {
            const customEvent = event as CustomEvent;
            const message = customEvent.detail;

            // Only process messages for our chat note
            if (!message || message.chatNoteId !== noteId) {
                return;
            }

            // Update last message timestamp
            lastMessageTimestamp = Date.now();

            // Cancel any pending cleanup when we receive a new message
            if (cleanupTimeoutId) {
                console.log(`[${responseId}] Cancelling scheduled cleanup due to new message`);
                window.clearTimeout(cleanupTimeoutId);
                cleanupTimeoutId = null;
            }

            console.log(`[${responseId}] LLM Stream message received: content=${!!message.content}, contentLength=${message.content?.length || 0}, thinking=${!!message.thinking}, toolExecution=${!!message.toolExecution}, done=${!!message.done}`);

            // Mark first message received
            if (!receivedAnyMessage) {
                receivedAnyMessage = true;
                console.log(`[${responseId}] First message received for chat note ${noteId}`);

                // Clear the initial timeout since we've received a message
                if (initialTimeoutId !== null) {
                    window.clearTimeout(initialTimeoutId);
                    initialTimeoutId = null;
                }
                
                // Start heartbeat monitoring
                resetHeartbeatTimeout();
            } else {
                // Reset heartbeat on each new message
                resetHeartbeatTimeout();
            }

            // Handle error
            if (message.error) {
                console.error(`[${responseId}] Stream error: ${message.error}`);
                performCleanup();
                reject(new Error(message.error));
                return;
            }

            // Handle thinking updates - only show if showThinking is enabled
            if (message.thinking && messageParams.showThinking) {
                console.log(`[${responseId}] Received thinking: ${message.thinking.substring(0, 100)}...`);
                onThinkingUpdate(message.thinking);
            }

            // Handle tool execution updates
            if (message.toolExecution) {
                console.log(`[${responseId}] Tool execution update:`, message.toolExecution);
                onToolExecution(message.toolExecution);
            }

            // Handle progress updates
            if (message.progressUpdate) {
                console.log(`[${responseId}] Progress update:`, message.progressUpdate);
                onProgressUpdate(message.progressUpdate);
            }

            // Handle user interaction requests
            if (message.userInteraction) {
                console.log(`[${responseId}] User interaction request:`, message.userInteraction);
                onUserInteraction(message.userInteraction).catch(error => {
                    console.error(`[${responseId}] Error handling user interaction:`, error);
                });
            }

            // Handle error recovery options
            if (message.errorRecovery) {
                console.log(`[${responseId}] Error recovery options:`, message.errorRecovery);
                onErrorRecovery(message.errorRecovery).catch(error => {
                    console.error(`[${responseId}] Error handling error recovery:`, error);
                });
            }

            // Handle content updates
            if (message.content) {
                // Simply append the new content - no complex deduplication
                assistantResponse += message.content;

                // Update the UI immediately with each chunk
                onContentUpdate(assistantResponse, message.done || false);
                receivedAnyContent = true;

                // Reset timeout since we got content
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                }

                // Set new timeout
                timeoutId = window.setTimeout(() => {
                    console.warn(`[${responseId}] Stream timeout for chat note ${noteId}`);
                    performCleanup();
                    reject(new Error('Stream timeout'));
                }, 30000);
            }

            // Handle completion
            if (message.done) {
                console.log(`[${responseId}] Stream completed for chat note ${noteId}, final response: ${assistantResponse.length} chars`);

                // Clear all timeouts
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Schedule cleanup after a brief delay to ensure all processing is complete
                cleanupTimeoutId = window.setTimeout(() => {
                    performCleanup();
                }, 100);
            }
        };

        // Register the event listener for WebSocket messages
        window.addEventListener('llm-stream-message', eventListener);

        console.log(`[${responseId}] Event listener registered, waiting for messages...`);
    });
}

/**
 * Clean up an event listener
 */
function cleanupEventListener(listener: ((event: Event) => void) | null): void {
    if (listener) {
        try {
            window.removeEventListener('llm-stream-message', listener);
            console.log(`Successfully removed event listener`);
        } catch (err) {
            console.error(`Error removing event listener:`, err);
        }
    }
}

/**
 * Get a direct response from the server without streaming
 */
export async function getDirectResponse(noteId: string, messageParams: any): Promise<any> {
    try {
        const postResponse = await server.post<any>(`llm/chat/${noteId}/messages`, {
            message: messageParams.content,
            includeContext: messageParams.useAdvancedContext,
            options: {
                temperature: 0.7,
                maxTokens: 2000
            }
        });

        return postResponse;
    } catch (error) {
        console.error('Error getting direct response:', error);
        throw error;
    }
}

/**
 * Send user interaction response
 * @param interactionId - The interaction ID
 * @param response - The user's response
 */
export async function sendUserInteractionResponse(interactionId: string, response: string): Promise<void> {
    try {
        await server.post<any>(`llm/interactions/${interactionId}/respond`, {
            response: response
        });
        console.log(`User interaction response sent: ${interactionId} -> ${response}`);
    } catch (error) {
        console.error('Error sending user interaction response:', error);
        throw error;
    }
}

/**
 * Send error recovery choice
 * @param sessionId - The chat session ID
 * @param errorId - The error ID
 * @param action - The recovery action chosen
 * @param parameters - Optional parameters for the action
 */
export async function sendErrorRecoveryChoice(sessionId: string, errorId: string, action: string, parameters?: any): Promise<void> {
    try {
        await server.post<any>(`llm/chat/${sessionId}/error/${errorId}/recover`, {
            action: action,
            parameters: parameters
        });
        console.log(`Error recovery choice sent: ${errorId} -> ${action}`);
    } catch (error) {
        console.error('Error sending error recovery choice:', error);
        throw error;
    }
}

/**
 * Cancel ongoing operations
 * @param sessionId - The chat session ID
 */
export async function cancelChatOperations(sessionId: string): Promise<void> {
    try {
        await server.post<any>(`llm/chat/${sessionId}/cancel`, {});
        console.log(`Chat operations cancelled for session: ${sessionId}`);
    } catch (error) {
        console.error('Error cancelling chat operations:', error);
        throw error;
    }
}

