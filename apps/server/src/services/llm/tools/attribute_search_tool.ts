/**
 * Attribute Search Tool
 *
 * This tool allows the LLM to search for notes based specifically on attributes.
 * It's specialized for finding notes with specific labels or relations.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import attributes from '../../attributes.js';
import searchService from '../../search/services/search.js';
import attributeFormatter from '../../attribute_formatter.js';
import type BNote from '../../../becca/entities/bnote.js';

/**
 * Definition of the attribute search tool
 */
export const attributeSearchToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'attribute_search',
        description: 'Search for notes with specific attributes (labels or relations). Use this when you need to find notes based on their metadata rather than content. IMPORTANT: attributeType must be exactly "label" or "relation" (lowercase).',
        parameters: {
            type: 'object',
            properties: {
                attributeType: {
                    type: 'string',
                    description: 'MUST be exactly "label" or "relation" (lowercase, no other values are valid)',
                    enum: ['label', 'relation']
                },
                attributeName: {
                    type: 'string',
                    description: 'Name of the attribute to search for (e.g., "important", "todo", "related-to")'
                },
                attributeValue: {
                    type: 'string',
                    description: 'Optional value of the attribute. If not provided, will find all notes with the given attribute name.'
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 20)'
                }
            },
            required: ['attributeType', 'attributeName']
        }
    }
};

/**
 * Attribute search tool implementation
 */
export class AttributeSearchTool implements ToolHandler {
    public definition: Tool = attributeSearchToolDefinition;

    /**
     * Execute the attribute search tool
     */
    public async execute(args: { attributeType: string, attributeName: string, attributeValue?: string, maxResults?: number }): Promise<string | object> {
        try {
            const { attributeType, attributeName, attributeValue, maxResults = 20 } = args;

            log.info(`Executing attribute_search tool - Type: "${attributeType}", Name: "${attributeName}", Value: "${attributeValue || 'any'}", MaxResults: ${maxResults}`);

            // Validate attribute type
            if (attributeType !== 'label' && attributeType !== 'relation') {
                return `Error: Invalid attribute type. Must be exactly "label" or "relation" (lowercase). You provided: "${attributeType}".`;
            }

            // Execute the search
            log.info(`Searching for notes with ${attributeType}: ${attributeName}${attributeValue ? ' = ' + attributeValue : ''}`);
            const searchStartTime = Date.now();

            let results: BNote[] = [];

            if (attributeType === 'label') {
                // For labels, we can use the existing getNotesWithLabel function
                results = attributes.getNotesWithLabel(attributeName, attributeValue);
            } else {
                // For relations, we need to build a search query
                const query = attributeFormatter.formatAttrForSearch({
                    type: "relation",
                    name: attributeName,
                    value: attributeValue
                }, attributeValue !== undefined);

                results = searchService.searchNotes(query, {
                    includeArchivedNotes: true,
                    ignoreHoistedNote: true
                });
            }

            // Limit results
            const limitedResults = results.slice(0, maxResults);

            const searchDuration = Date.now() - searchStartTime;

            log.info(`Attribute search completed in ${searchDuration}ms, found ${results.length} matching notes, returning ${limitedResults.length}`);

            if (limitedResults.length > 0) {
                // Log top results
                limitedResults.slice(0, 3).forEach((note: BNote, index: number) => {
                    log.info(`Result ${index + 1}: "${note.title}"`);
                });
            } else {
                log.info(`No notes found with ${attributeType} "${attributeName}"${attributeValue ? ' = ' + attributeValue : ''}`);
            }

            // Format the results
            return {
                count: limitedResults.length,
                totalFound: results.length,
                attributeType,
                attributeName,
                attributeValue,
                results: limitedResults.map((note: BNote) => {
                    // Get relevant attributes of this type
                    const relevantAttributes = note.getOwnedAttributes()
                        .filter(attr => attr.type === attributeType && attr.name === attributeName)
                        .map(attr => ({
                            type: attr.type,
                            name: attr.name,
                            value: attr.value
                        }));

                    // Get a preview of the note content
                    let contentPreview = '';
                    try {
                        const content = note.getContent();
                        if (typeof content === 'string') {
                            contentPreview = content.length > 150 ? content.substring(0, 150) + '...' : content;
                        } else if (Buffer.isBuffer(content)) {
                            contentPreview = '[Binary content]';
                        } else {
                            contentPreview = String(content).substring(0, 150) + (String(content).length > 150 ? '...' : '');
                        }
                    } catch (_) {
                        contentPreview = '[Content not available]';
                    }

                    return {
                        noteId: note.noteId,
                        title: note.title,
                        preview: contentPreview,
                        relevantAttributes: relevantAttributes,
                        type: note.type,
                        dateCreated: note.dateCreated,
                        dateModified: note.dateModified
                    };
                })
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error executing attribute_search tool: ${errorMessage}`);
            return `Error: ${errorMessage}`;
        }
    }
}
