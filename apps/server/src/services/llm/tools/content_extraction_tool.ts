/**
 * Content Extraction Tool
 *
 * This tool allows the LLM to extract structured information from notes.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import becca from '../../../becca/becca.js';

interface CodeBlock {
    code: string;
    language?: string;
}

interface Heading {
    text: string;
    level: number; // 1 for H1, 2 for H2, etc.
}

interface List {
    type: "unordered" | "ordered";
    items: string[];
}

interface Table {
    headers: string[];
    rows: string[][];
}

/**
 * Definition of the content extraction tool
 */
export const contentExtractionToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'extract_content',
        description: 'Extract structured information from a note\'s content, such as lists, tables, or specific sections',
        parameters: {
            type: 'object',
            properties: {
                noteId: {
                    type: 'string',
                    description: 'ID of the note to extract content from'
                },
                extractionType: {
                    type: 'string',
                    description: 'Type of content to extract',
                    enum: ['lists', 'tables', 'headings', 'codeBlocks', 'all']
                },
                format: {
                    type: 'string',
                    description: 'Format to return the extracted content in',
                    enum: ['json', 'markdown', 'text']
                },
                query: {
                    type: 'string',
                    description: 'Optional search query to filter extracted content (e.g., "tasks related to finance")'
                }
            },
            required: ['noteId', 'extractionType']
        }
    }
};

/**
 * Content extraction tool implementation
 */
export class ContentExtractionTool implements ToolHandler {
    public definition: Tool = contentExtractionToolDefinition;

    /**
     * Execute the content extraction tool
     */
    public async execute(args: {
        noteId: string,
        extractionType: 'lists' | 'tables' | 'headings' | 'codeBlocks' | 'all',
        format?: 'json' | 'markdown' | 'text',
        query?: string
    }): Promise<string | object> {
        try {
            const { noteId, extractionType, format = 'json', query } = args;

            log.info(`Executing extract_content tool - NoteID: "${noteId}", Type: ${extractionType}, Format: ${format}`);

            // Get the note from becca
            const note = becca.notes[noteId];

            if (!note) {
                log.info(`Note with ID ${noteId} not found - returning error`);
                return `Error: Note with ID ${noteId} not found`;
            }

            log.info(`Found note: "${note.title}" (Type: ${note.type})`);

            // Get the note content
            const content = await note.getContent();
            if (!content) {
                return {
                    success: false,
                    message: 'Note content is empty'
                };
            }

            log.info(`Retrieved note content, length: ${content.length} chars`);

            // Extract the requested content
            const extractedContent: any = {};

            if (extractionType === 'lists' || extractionType === 'all') {
                extractedContent.lists = this.extractLists(typeof content === 'string' ? content : content.toString());
                log.info(`Extracted ${extractedContent.lists.length} lists`);
            }

            if (extractionType === 'tables' || extractionType === 'all') {
                extractedContent.tables = this.extractTables(typeof content === 'string' ? content : content.toString());
                log.info(`Extracted ${extractedContent.tables.length} tables`);
            }

            if (extractionType === 'headings' || extractionType === 'all') {
                extractedContent.headings = this.extractHeadings(typeof content === 'string' ? content : content.toString());
                log.info(`Extracted ${extractedContent.headings.length} headings`);
            }

            if (extractionType === 'codeBlocks' || extractionType === 'all') {
                extractedContent.codeBlocks = this.extractCodeBlocks(typeof content === 'string' ? content : content.toString());
                log.info(`Extracted ${extractedContent.codeBlocks.length} code blocks`);
            }

            // Filter by query if provided
            if (query) {
                log.info(`Filtering extracted content with query: "${query}"`);
                this.filterContentByQuery(extractedContent, query);
            }

            // Format the response based on requested format
            if (format === 'markdown') {
                return this.formatAsMarkdown(extractedContent, extractionType);
            } else if (format === 'text') {
                return this.formatAsText(extractedContent, extractionType);
            } else {
                // Default to JSON format
                return {
                    success: true,
                    noteId: note.noteId,
                    title: note.title,
                    extractionType,
                    content: extractedContent
                };
            }
        } catch (error: any) {
            log.error(`Error executing extract_content tool: ${error.message || String(error)}`);
            return `Error: ${error.message || String(error)}`;
        }
    }

    /**
     * Extract lists from HTML content
     */
    private extractLists(content: string): List[] {
        const lists: List[] = [];

        // Extract unordered lists
        const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
        let ulMatch;

        while ((ulMatch = ulRegex.exec(content)) !== null) {
            const listContent = ulMatch[1];
            const items = this.extractListItems(listContent);

            if (items.length > 0) {
                lists.push({
                    type: 'unordered',
                    items
                });
            }
        }

        // Extract ordered lists
        const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
        let olMatch;

        while ((olMatch = olRegex.exec(content)) !== null) {
            const listContent = olMatch[1];
            const items = this.extractListItems(listContent);

            if (items.length > 0) {
                lists.push({
                    type: 'ordered',
                    items
                });
            }
        }

        return lists;
    }

    /**
     * Extract list items from list content
     */
    private extractListItems(listContent: string): string[] {
        const items: string[] = [];
        const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let itemMatch;

        while ((itemMatch = itemRegex.exec(listContent)) !== null) {
            const itemText = this.stripHtml(itemMatch[1]).trim();
            if (itemText) {
                items.push(itemText);
            }
        }

        return items;
    }

    /**
     * Extract tables from HTML content
     */
    private extractTables(content: string): Table[] {
        const tables: Table[] = [];
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let tableMatch: RegExpExecArray | null;

        while ((tableMatch = tableRegex.exec(content)) !== null) {
            const tableContent = tableMatch[1];
            const headers: string[] = [];
            const rows: string[][] = [];

            // Extract table headers
            const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
            let headerMatch;
            while ((headerMatch = headerRegex.exec(tableContent)) !== null) {
                headers.push(this.stripHtml(headerMatch[1]).trim());
            }

            // Extract table rows
            const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
                const rowContent = rowMatch[1];
                const cells: string[] = [];

                const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
                let cellMatch;
                while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                    cells.push(this.stripHtml(cellMatch[1]).trim());
                }

                if (cells.length > 0) {
                    rows.push(cells);
                }
            }

            if (headers.length > 0 || rows.length > 0) {
                tables.push({
                    headers,
                    rows
                });
            }
        }

        return tables;
    }

    /**
     * Extract headings from HTML content
     */
    private extractHeadings(content: string): Array<{ level: number, text: string }> {
        const headings: Heading[] = [];

        for (let i = 1; i <= 6; i++) {
            const headingRegex = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\/h${i}>`, 'gi');
            let headingMatch;

            while ((headingMatch = headingRegex.exec(content)) !== null) {
                const headingText = this.stripHtml(headingMatch[1]).trim();
                if (headingText) {
                    headings.push({
                        level: i,
                        text: headingText
                    });
                }
            }
        }

        return headings;
    }

    /**
     * Extract code blocks from HTML content
     */
    private extractCodeBlocks(content: string): Array<{ language?: string, code: string }> {
        const codeBlocks: CodeBlock[] = [];

        // Look for <pre> and <code> blocks
        const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
        let preMatch;

        while ((preMatch = preRegex.exec(content)) !== null) {
            const preContent = preMatch[1];
            // Check if there's a nested <code> tag
            const codeMatch = /<code[^>]*>([\s\S]*?)<\/code>/i.exec(preContent);

            if (codeMatch) {
                // Extract language if it's in the class attribute
                const classMatch = /class="[^"]*language-([^"\s]+)[^"]*"/i.exec(preMatch[0]);
                codeBlocks.push({
                    language: classMatch ? classMatch[1] : undefined,
                    code: this.decodeHtmlEntities(codeMatch[1]).trim()
                });
            } else {
                // Just a <pre> without <code>
                codeBlocks.push({
                    code: this.decodeHtmlEntities(preContent).trim()
                });
            }
        }

        // Also look for standalone <code> blocks not inside <pre>
        const standaloneCodeRegex = /(?<!<pre[^>]*>[\s\S]*?)<code[^>]*>([\s\S]*?)<\/code>/gi;
        let standaloneCodeMatch;

        while ((standaloneCodeMatch = standaloneCodeRegex.exec(content)) !== null) {
            codeBlocks.push({
                code: this.decodeHtmlEntities(standaloneCodeMatch[1]).trim()
            });
        }

        return codeBlocks;
    }

    /**
     * Filter content by query
     */
    private filterContentByQuery(content: any, query: string): void {
        const lowerQuery = query.toLowerCase();

        if (content.lists) {
            content.lists = content.lists.filter((list: { type: string; items: string[] }) => {
                // Check if any item in the list contains the query
                return list.items.some((item: string) => item.toLowerCase().includes(lowerQuery));
            });

            // Also filter individual items in each list
            content.lists.forEach((list: { type: string; items: string[] }) => {
                list.items = list.items.filter((item: string) => item.toLowerCase().includes(lowerQuery));
            });
        }

        if (content.headings) {
            content.headings = content.headings.filter((heading: { level: number; text: string }) =>
                heading.text.toLowerCase().includes(lowerQuery)
            );
        }

        if (content.tables) {
            content.tables = content.tables.filter((table: { headers: string[]; rows: string[][] }) => {
                // Check if any header contains the query
                const headerMatch = table.headers.some((header: string) =>
                    header.toLowerCase().includes(lowerQuery)
                );

                // Check if any cell in any row contains the query
                const cellMatch = table.rows.some((row: string[]) =>
                    row.some((cell: string) => cell.toLowerCase().includes(lowerQuery))
                );

                return headerMatch || cellMatch;
            });
        }

        if (content.codeBlocks) {
            content.codeBlocks = content.codeBlocks.filter((block: { language?: string; code: string }) =>
                block.code.toLowerCase().includes(lowerQuery)
            );
        }
    }

    /**
     * Format extracted content as Markdown
     */
    private formatAsMarkdown(content: any, extractionType: string): string {
        let markdown = '';

        if (extractionType === 'lists' || extractionType === 'all') {
            if (content.lists && content.lists.length > 0) {
                markdown += '## Lists\n\n';

                content.lists.forEach((list: any, index: number) => {
                    markdown += `### List ${index + 1} (${list.type})\n\n`;

                    list.items.forEach((item: string) => {
                        if (list.type === 'unordered') {
                            markdown += `- ${item}\n`;
                        } else {
                            markdown += `1. ${item}\n`;
                        }
                    });

                    markdown += '\n';
                });
            }
        }

        if (extractionType === 'headings' || extractionType === 'all') {
            if (content.headings && content.headings.length > 0) {
                markdown += '## Headings\n\n';

                content.headings.forEach((heading: any) => {
                    markdown += `${'#'.repeat(heading.level)} ${heading.text}\n\n`;
                });
            }
        }

        if (extractionType === 'tables' || extractionType === 'all') {
            if (content.tables && content.tables.length > 0) {
                markdown += '## Tables\n\n';

                content.tables.forEach((table: any, index: number) => {
                    markdown += `### Table ${index + 1}\n\n`;

                    // Add headers
                    if (table.headers.length > 0) {
                        markdown += '| ' + table.headers.join(' | ') + ' |\n';
                        markdown += '| ' + table.headers.map(() => '---').join(' | ') + ' |\n';
                    }

                    // Add rows
                    table.rows.forEach((row: string[]) => {
                        markdown += '| ' + row.join(' | ') + ' |\n';
                    });

                    markdown += '\n';
                });
            }
        }

        if (extractionType === 'codeBlocks' || extractionType === 'all') {
            if (content.codeBlocks && content.codeBlocks.length > 0) {
                markdown += '## Code Blocks\n\n';

                content.codeBlocks.forEach((block: any, index: number) => {
                    markdown += `### Code Block ${index + 1}\n\n`;

                    if (block.language) {
                        markdown += '```' + block.language + '\n';
                    } else {
                        markdown += '```\n';
                    }

                    markdown += block.code + '\n';
                    markdown += '```\n\n';
                });
            }
        }

        return markdown.trim();
    }

    /**
     * Format extracted content as plain text
     */
    private formatAsText(content: any, extractionType: string): string {
        let text = '';

        if (extractionType === 'lists' || extractionType === 'all') {
            if (content.lists && content.lists.length > 0) {
                text += 'LISTS:\n\n';

                content.lists.forEach((list: any, index: number) => {
                    text += `List ${index + 1} (${list.type}):\n\n`;

                    list.items.forEach((item: string, itemIndex: number) => {
                        if (list.type === 'unordered') {
                            text += `• ${item}\n`;
                        } else {
                            text += `${itemIndex + 1}. ${item}\n`;
                        }
                    });

                    text += '\n';
                });
            }
        }

        if (extractionType === 'headings' || extractionType === 'all') {
            if (content.headings && content.headings.length > 0) {
                text += 'HEADINGS:\n\n';

                content.headings.forEach((heading: any) => {
                    text += `${heading.text} (Level ${heading.level})\n`;
                });

                text += '\n';
            }
        }

        if (extractionType === 'tables' || extractionType === 'all') {
            if (content.tables && content.tables.length > 0) {
                text += 'TABLES:\n\n';

                content.tables.forEach((table: any, index: number) => {
                    text += `Table ${index + 1}:\n\n`;

                    // Add headers
                    if (table.headers.length > 0) {
                        text += table.headers.join(' | ') + '\n';
                        text += table.headers.map(() => '-----').join(' | ') + '\n';
                    }

                    // Add rows
                    table.rows.forEach((row: string[]) => {
                        text += row.join(' | ') + '\n';
                    });

                    text += '\n';
                });
            }
        }

        if (extractionType === 'codeBlocks' || extractionType === 'all') {
            if (content.codeBlocks && content.codeBlocks.length > 0) {
                text += 'CODE BLOCKS:\n\n';

                content.codeBlocks.forEach((block: any, index: number) => {
                    text += `Code Block ${index + 1}`;

                    if (block.language) {
                        text += ` (${block.language})`;
                    }

                    text += ':\n\n';
                    text += block.code + '\n\n';
                });
            }
        }

        return text.trim();
    }

    /**
     * Strip HTML tags from content
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * Decode HTML entities
     */
    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');
    }
}
