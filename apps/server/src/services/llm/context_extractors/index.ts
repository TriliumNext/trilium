/**
 * Context Extractors Module
 *
 * Provides tools for extracting context from notes, files, and other sources.
 */

import { ContextualThinkingTool } from './contextual_thinking_tool.js';
import { NoteNavigatorTool } from './note_navigator_tool.js';
import { QueryDecompositionTool } from './query_decomposition_tool.js';

// Import services needed for initialization
import contextService from '../context/services/context_service.js';
import log from '../../log.js';

// Import interfaces
import type {
  IContextualThinkingTool,
  INoteNavigatorTool,
  IQueryDecompositionTool
} from '../interfaces/agent_tool_interfaces.js';

/**
 * Agent Tools Manager
 *
 * Manages and provides access to all available agent tools.
 */
export class AgentToolsManager {
  private noteNavigatorTool: NoteNavigatorTool | null = null;
  private queryDecompositionTool: QueryDecompositionTool | null = null;
  private contextualThinkingTool: ContextualThinkingTool | null = null;
  private initialized = false;

  /**
   * Initialize all tools
   */
  async initialize(forceInit = false): Promise<void> {
    if (this.initialized && !forceInit) {
      return;
    }

    try {

      // Initialize the context service first
      try {
        await contextService.initialize();
      } catch (error) {
        log.error(`Error initializing context service: ${error}`);
        // Continue anyway, some tools might work without the context service
      }

      // Create tool instances
      this.noteNavigatorTool = new NoteNavigatorTool();
      this.queryDecompositionTool = new QueryDecompositionTool();
      this.contextualThinkingTool = new ContextualThinkingTool();

      this.initialized = true;
      log.info("Agent tools initialized successfully");
    } catch (error) {
      log.error(`Failed to initialize agent tools: ${error}`);
      throw error;
    }
  }

  /**
   * Get all available tools
   */
  getAllTools() {
    return [
      {
        name: "navigate_to_note",
        description: "Navigates to a specific note",
        function: this.noteNavigatorTool?.getNoteInfo.bind(this.noteNavigatorTool)
      },
      {
        name: "decompose_query",
        description: "Breaks down a complex query into simpler sub-queries",
        function: this.queryDecompositionTool?.decomposeQuery.bind(this.queryDecompositionTool)
      },
      {
        name: "contextual_thinking",
        description: "Provides structured thinking about a problem using available context",
        function: this.contextualThinkingTool?.startThinking.bind(this.contextualThinkingTool)
      }
    ].filter(tool => tool.function !== undefined);
  }

  /**
   * Get all tool objects (for direct access)
   */
  getTools() {
    return {
      noteNavigator: this.noteNavigatorTool as INoteNavigatorTool,
      queryDecomposition: this.queryDecompositionTool as IQueryDecompositionTool,
      contextualThinking: this.contextualThinkingTool as IContextualThinkingTool
    };
  }
}

// Create and export singleton instance
const agentTools = new AgentToolsManager();
export default agentTools;

// Export all tools for direct import if needed
export {
  NoteNavigatorTool,
  QueryDecompositionTool,
  ContextualThinkingTool
};
