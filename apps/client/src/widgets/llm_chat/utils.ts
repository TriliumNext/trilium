/**
 * Utility functions for LLM Chat
 */
import { marked } from "marked";
import { formatCodeBlocks } from "../../services/syntax_highlight.js";

/**
 * Format markdown content for display
 */
export function formatMarkdown(content: string): string {
    if (!content) return '';

    // First, extract HTML thinking visualization to protect it from replacements
    const thinkingBlocks: string[] = [];
    let processedContent = content.replace(/<div class=['"](thinking-process|reasoning-process)['"][\s\S]*?<\/div>/g, (match) => {
        const placeholder = `__THINKING_BLOCK_${thinkingBlocks.length}__`;
        thinkingBlocks.push(match);
        return placeholder;
    });

    // Use marked library to parse the markdown
    const markedContent = marked(processedContent, {
        breaks: true,   // Convert line breaks to <br>
        gfm: true,      // Enable GitHub Flavored Markdown
        silent: true    // Ignore errors
    });

    // Handle potential promise (though it shouldn't be with our options)
    if (typeof markedContent === 'string') {
        processedContent = markedContent;
    } else {
        console.warn('Marked returned a promise unexpectedly');
        // Use the original content as fallback
        processedContent = content;
    }

    // Restore thinking visualization blocks
    thinkingBlocks.forEach((block, index) => {
        processedContent = processedContent.replace(`__THINKING_BLOCK_${index}__`, block);
    });

    return processedContent;
}

/**
 * Simple HTML escaping for safer content display
 */
export function escapeHtml(text: string): string {
    if (typeof text !== 'string') {
        text = String(text || '');
    }

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Apply syntax highlighting to content
 */
export function applyHighlighting(element: HTMLElement): void {
    formatCodeBlocks($(element));
}

/**
 * Format tool arguments for display
 */
export function formatToolArgs(args: any): string {
    if (!args || typeof args !== 'object') return '';

    return Object.entries(args)
        .map(([key, value]) => {
            // Format the value based on its type
            let displayValue;
            if (typeof value === 'string') {
                displayValue = value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
            } else if (value === null) {
                displayValue = 'null';
            } else if (Array.isArray(value)) {
                displayValue = '[...]'; // Simplified array representation
            } else if (typeof value === 'object') {
                displayValue = '{...}'; // Simplified object representation
            } else {
                displayValue = String(value);
            }

            return `<span class="text-primary">${escapeHtml(key)}</span>: ${escapeHtml(displayValue)}`;
        })
        .join(', ');
}
