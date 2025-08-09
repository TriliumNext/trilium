"use strict";

import normalizeString from "normalize-strings";
import lex from "./lex.js";
import handleParens from "./handle_parens.js";
import parse from "./parse.js";
import SearchResult from "../search_result.js";
import SearchContext from "../search_context.js";
import becca from "../../../becca/becca.js";
import beccaService from "../../../becca/becca_service.js";
import { normalize, escapeHtml, escapeRegExp } from "../../utils.js";
import log from "../../log.js";
import hoistedNoteService from "../../hoisted_note.js";
import type BNote from "../../../becca/entities/bnote.js";
import type BAttribute from "../../../becca/entities/battribute.js";
import type { SearchParams, TokenStructure } from "./types.js";
import type Expression from "../expressions/expression.js";
import sql from "../../sql.js";
import scriptService from "../../script.js";
import striptags from "striptags";
import protectedSessionService from "../../protected_session.js";

export interface SearchNoteResult {
    searchResultNoteIds: string[];
    highlightedTokens: string[];
    error: string | null;
}

export const EMPTY_RESULT: SearchNoteResult = {
    searchResultNoteIds: [],
    highlightedTokens: [],
    error: null
};

function searchFromNote(note: BNote): SearchNoteResult {
    let searchResultNoteIds;
    let highlightedTokens: string[];

    const searchScript = note.getRelationValue("searchScript");
    const searchString = note.getLabelValue("searchString") || "";
    let error: string | null = null;

    if (searchScript) {
        searchResultNoteIds = searchFromRelation(note, "searchScript");
        highlightedTokens = [];
    } else {
        const searchContext = new SearchContext({
            fastSearch: note.hasLabel("fastSearch"),
            ancestorNoteId: note.getRelationValue("ancestor") || undefined,
            ancestorDepth: note.getLabelValue("ancestorDepth") || undefined,
            includeArchivedNotes: note.hasLabel("includeArchivedNotes"),
            orderBy: note.getLabelValue("orderBy") || undefined,
            orderDirection: note.getLabelValue("orderDirection") || undefined,
            limit: parseInt(note.getLabelValue("limit") || "0", 10),
            debug: note.hasLabel("debug"),
            fuzzyAttributeSearch: false
        });

        searchResultNoteIds = findResultsWithQuery(searchString, searchContext).map((sr) => sr.noteId);

        highlightedTokens = searchContext.highlightedTokens;
        error = searchContext.getError();
    }

    // we won't return search note's own noteId
    // also don't allow root since that would force infinite cycle
    return {
        searchResultNoteIds: searchResultNoteIds.filter((resultNoteId) => !["root", note.noteId].includes(resultNoteId)),
        highlightedTokens,
        error: error
    };
}

function searchFromRelation(note: BNote, relationName: string) {
    const scriptNote = note.getRelationTarget(relationName);

    if (!scriptNote) {
        log.info(`Search note's relation ${relationName} has not been found.`);

        return [];
    }

    if (!scriptNote.isJavaScript() || scriptNote.getScriptEnv() !== "backend") {
        log.info(`Note ${scriptNote.noteId} is not executable.`);

        return [];
    }

    if (!note.isContentAvailable()) {
        log.info(`Note ${scriptNote.noteId} is not available outside of protected session.`);

        return [];
    }

    const result = scriptService.executeNote(scriptNote, { originEntity: note });

    if (!Array.isArray(result)) {
        log.info(`Result from ${scriptNote.noteId} is not an array.`);

        return [];
    }

    if (result.length === 0) {
        return [];
    }

    // we expect either array of noteIds (strings) or notes, in that case we extract noteIds ourselves
    return typeof result[0] === "string" ? result : result.map((item) => item.noteId);
}

function loadNeededInfoFromDatabase() {
    /**
     * This complex structure is needed to calculate total occupied space by a note. Several object instances
     * (note, revisions, attachments) can point to a single blobId, and thus the blob size should count towards the total
     * only once.
     *
     * noteId => { blobId => blobSize }
     */
    const noteBlobs: Record<string, Record<string, number>> = {};

    type NoteContentLengthsRow = {
        noteId: string;
        blobId: string;
        length: number;
    };
    const noteContentLengths = sql.getRows<NoteContentLengthsRow>(`
        SELECT
            noteId,
            blobId,
            LENGTH(content) AS length
        FROM notes
             JOIN blobs USING(blobId)
        WHERE notes.isDeleted = 0`);

    for (const { noteId, blobId, length } of noteContentLengths) {
        if (!(noteId in becca.notes)) {
            log.error(`Note '${noteId}' not found in becca.`);
            continue;
        }

        becca.notes[noteId].contentSize = length;
        becca.notes[noteId].revisionCount = 0;

        noteBlobs[noteId] = { [blobId]: length };
    }

    type AttachmentContentLengthsRow = {
        noteId: string;
        blobId: string;
        length: number;
    };
    const attachmentContentLengths = sql.getRows<AttachmentContentLengthsRow>(`
        SELECT
            ownerId AS noteId,
            attachments.blobId,
            LENGTH(content) AS length
        FROM attachments
            JOIN notes ON attachments.ownerId = notes.noteId
            JOIN blobs ON attachments.blobId = blobs.blobId
        WHERE attachments.isDeleted = 0
            AND notes.isDeleted = 0`);

    for (const { noteId, blobId, length } of attachmentContentLengths) {
        if (!(noteId in becca.notes)) {
            log.error(`Note '${noteId}' not found in becca.`);
            continue;
        }

        if (!(noteId in noteBlobs)) {
            log.error(`Did not find a '${noteId}' in the noteBlobs.`);
            continue;
        }

        noteBlobs[noteId][blobId] = length;
    }

    for (const noteId in noteBlobs) {
        becca.notes[noteId].contentAndAttachmentsSize = Object.values(noteBlobs[noteId]).reduce((acc, size) => acc + size, 0);
    }

    type RevisionRow = {
        noteId: string;
        blobId: string;
        length: number;
        isNoteRevision: true;
    };
    const revisionContentLengths = sql.getRows<RevisionRow>(`
            SELECT
                noteId,
                revisions.blobId,
                LENGTH(content) AS length,
                1 AS isNoteRevision
            FROM notes
                JOIN revisions USING(noteId)
                JOIN blobs ON revisions.blobId = blobs.blobId
            WHERE notes.isDeleted = 0
        UNION ALL
            SELECT
                noteId,
                revisions.blobId,
                LENGTH(content) AS length,
                0 AS isNoteRevision -- it's attachment not counting towards revision count
            FROM notes
                JOIN revisions USING(noteId)
                JOIN attachments ON attachments.ownerId = revisions.revisionId
                JOIN blobs ON attachments.blobId = blobs.blobId
            WHERE notes.isDeleted = 0`);

    for (const { noteId, blobId, length, isNoteRevision } of revisionContentLengths) {
        if (!(noteId in becca.notes)) {
            log.error(`Note '${noteId}' not found in becca.`);
            continue;
        }

        if (!(noteId in noteBlobs)) {
            log.error(`Did not find a '${noteId}' in the noteBlobs.`);
            continue;
        }

        noteBlobs[noteId][blobId] = length;

        if (isNoteRevision) {
            const noteRevision = becca.notes[noteId];
            if (noteRevision && noteRevision.revisionCount) {
                noteRevision.revisionCount++;
            }
        }
    }

    for (const noteId in noteBlobs) {
        becca.notes[noteId].contentAndAttachmentsAndRevisionsSize = Object.values(noteBlobs[noteId]).reduce((acc, size) => acc + size, 0);
    }
}

function findResultsWithExpression(expression: Expression, searchContext: SearchContext): SearchResult[] {
    if (searchContext.dbLoadNeeded) {
        loadNeededInfoFromDatabase();
    }

    // Phase 1: Try exact matches first (without fuzzy matching)
    const exactResults = performSearch(expression, searchContext, false);
    
    // Check if we have sufficient high-quality results
    const minResultThreshold = 5;
    const minScoreForQuality = 10; // Minimum score to consider a result "high quality"
    
    const highQualityResults = exactResults.filter(result => result.score >= minScoreForQuality);
    
    // If we have enough high-quality exact matches, return them
    if (highQualityResults.length >= minResultThreshold) {
        return exactResults;
    }
    
    // Phase 2: Add fuzzy matching as fallback
    const fuzzyResults = performSearch(expression, searchContext, true);
    
    // Merge results, ensuring exact matches always rank higher than fuzzy matches
    return mergeExactAndFuzzyResults(exactResults, fuzzyResults);
}

function performSearch(expression: Expression, searchContext: SearchContext, enableFuzzyMatching: boolean): SearchResult[] {
    const allNoteSet = becca.getAllNoteSet();

    const noteIdToNotePath: Record<string, string[]> = {};
    const executionContext = {
        noteIdToNotePath
    };

    // Store original fuzzy setting and temporarily override it
    const originalFuzzyMatching = searchContext.enableFuzzyMatching;
    searchContext.enableFuzzyMatching = enableFuzzyMatching;

    const noteSet = expression.execute(allNoteSet, executionContext, searchContext);

    const searchResults = noteSet.notes.map((note) => {
        const notePathArray = executionContext.noteIdToNotePath[note.noteId] || note.getBestNotePath();

        if (!notePathArray) {
            throw new Error(`Can't find note path for note ${JSON.stringify(note.getPojo())}`);
        }

        return new SearchResult(notePathArray);
    });

    for (const res of searchResults) {
        res.computeScore(searchContext.fulltextQuery, searchContext.highlightedTokens, enableFuzzyMatching);
    }

    // Restore original fuzzy setting
    searchContext.enableFuzzyMatching = originalFuzzyMatching;

    if (!noteSet.sorted) {
        searchResults.sort((a, b) => {
            if (a.score > b.score) {
                return -1;
            } else if (a.score < b.score) {
                return 1;
            }

            // if score does not decide then sort results by depth of the note.
            // This is based on the assumption that more important results are closer to the note root.
            if (a.notePathArray.length === b.notePathArray.length) {
                return a.notePathTitle < b.notePathTitle ? -1 : 1;
            }

            return a.notePathArray.length < b.notePathArray.length ? -1 : 1;
        });
    }

    return searchResults;
}

function mergeExactAndFuzzyResults(exactResults: SearchResult[], fuzzyResults: SearchResult[]): SearchResult[] {
    // Create a map of exact result note IDs for deduplication
    const exactNoteIds = new Set(exactResults.map(result => result.noteId));
    
    // Add fuzzy results that aren't already in exact results
    const additionalFuzzyResults = fuzzyResults.filter(result => !exactNoteIds.has(result.noteId));
    
    // Sort exact results by score (best exact matches first)
    exactResults.sort((a, b) => {
        if (a.score > b.score) {
            return -1;
        } else if (a.score < b.score) {
            return 1;
        }

        // if score does not decide then sort results by depth of the note.
        if (a.notePathArray.length === b.notePathArray.length) {
            return a.notePathTitle < b.notePathTitle ? -1 : 1;
        }

        return a.notePathArray.length < b.notePathArray.length ? -1 : 1;
    });
    
    // Sort fuzzy results by score (best fuzzy matches first)
    additionalFuzzyResults.sort((a, b) => {
        if (a.score > b.score) {
            return -1;
        } else if (a.score < b.score) {
            return 1;
        }

        // if score does not decide then sort results by depth of the note.
        if (a.notePathArray.length === b.notePathArray.length) {
            return a.notePathTitle < b.notePathTitle ? -1 : 1;
        }

        return a.notePathArray.length < b.notePathArray.length ? -1 : 1;
    });
    
    // CRITICAL: Always put exact matches before fuzzy matches, regardless of scores
    return [...exactResults, ...additionalFuzzyResults];
}

function parseQueryToExpression(query: string, searchContext: SearchContext) {
    const { fulltextQuery, fulltextTokens, expressionTokens } = lex(query);
    searchContext.fulltextQuery = fulltextQuery;

    let structuredExpressionTokens: TokenStructure;

    try {
        structuredExpressionTokens = handleParens(expressionTokens);
    } catch (e: any) {
        structuredExpressionTokens = [];
        searchContext.addError(e.message);
    }

    const expression = parse({
        fulltextTokens,
        expressionTokens: structuredExpressionTokens,
        searchContext,
        originalQuery: query
    });

    if (searchContext.debug) {
        searchContext.debugInfo = {
            fulltextTokens,
            structuredExpressionTokens,
            expression
        };

        log.info(`Search debug: ${JSON.stringify(searchContext.debugInfo, null, 4)}`);
    }

    return expression;
}

function searchNotes(query: string, params: SearchParams = {}): BNote[] {
    const searchResults = findResultsWithQuery(query, new SearchContext(params));

    return searchResults.map((sr) => becca.notes[sr.noteId]);
}

function findResultsWithQuery(query: string, searchContext: SearchContext): SearchResult[] {
    query = query || "";
    searchContext.originalQuery = query;

    const expression = parseQueryToExpression(query, searchContext);

    if (!expression) {
        return [];
    }

    return findResultsWithExpression(expression, searchContext);
}

function findFirstNoteWithQuery(query: string, searchContext: SearchContext): BNote | null {
    const searchResults = findResultsWithQuery(query, searchContext);

    return searchResults.length > 0 ? becca.notes[searchResults[0].noteId] : null;
}

function extractContentSnippet(noteId: string, searchTokens: string[], maxLength: number = 200): string {
    const note = becca.notes[noteId];
    if (!note) {
        return "";
    }

    // Only extract content for text-based notes
    if (!["text", "code", "mermaid", "canvas", "mindMap"].includes(note.type)) {
        return "";
    }

    try {
        let content = note.getContent();
        
        if (!content || typeof content !== "string") {
            return "";
        }

        // Handle protected notes
        if (note.isProtected && protectedSessionService.isProtectedSessionAvailable()) {
            try {
                content = protectedSessionService.decryptString(content) || "";
            } catch (e) {
                return ""; // Can't decrypt, don't show content
            }
        } else if (note.isProtected) {
            return ""; // Protected but no session available
        }

        // Strip HTML tags for text notes
        if (note.type === "text") {
            content = striptags(content);
        }

        // Normalize whitespace
        content = content.replace(/\s+/g, " ").trim();

        if (!content) {
            return "";
        }

        // Try to find a snippet around the first matching token
        const normalizedContent = normalizeString(content.toLowerCase());
        let snippetStart = 0;
        let matchFound = false;

        for (const token of searchTokens) {
            const normalizedToken = normalizeString(token.toLowerCase());
            const matchIndex = normalizedContent.indexOf(normalizedToken);
            
            if (matchIndex !== -1) {
                // Center the snippet around the match
                snippetStart = Math.max(0, matchIndex - maxLength / 2);
                matchFound = true;
                break;
            }
        }

        // Extract snippet
        let snippet = content.substring(snippetStart, snippetStart + maxLength);
        
        // Try to start/end at word boundaries
        if (snippetStart > 0) {
            const firstSpace = snippet.indexOf(" ");
            if (firstSpace > 0 && firstSpace < 20) {
                snippet = snippet.substring(firstSpace + 1);
            }
            snippet = "..." + snippet;
        }
        
        if (snippetStart + maxLength < content.length) {
            const lastSpace = snippet.lastIndexOf(" ");
            if (lastSpace > snippet.length - 20) {
                snippet = snippet.substring(0, lastSpace);
            }
            snippet = snippet + "...";
        }

        return snippet;
    } catch (e) {
        log.error(`Error extracting content snippet for note ${noteId}: ${e}`);
        return "";
    }
}

function searchNotesForAutocomplete(query: string, fastSearch: boolean = true) {
    const searchContext = new SearchContext({
        fastSearch: fastSearch,
        includeArchivedNotes: false,
        includeHiddenNotes: true,
        fuzzyAttributeSearch: true,
        ignoreInternalAttributes: true,
        ancestorNoteId: hoistedNoteService.isHoistedInHiddenSubtree() ? "root" : hoistedNoteService.getHoistedNoteId()
    });

    const allSearchResults = findResultsWithQuery(query, searchContext);

    const trimmed = allSearchResults.slice(0, 200);

    // Extract content snippets
    for (const result of trimmed) {
        result.contentSnippet = extractContentSnippet(result.noteId, searchContext.highlightedTokens);
    }

    highlightSearchResults(trimmed, searchContext.highlightedTokens, searchContext.ignoreInternalAttributes);

    return trimmed.map((result) => {
        const { title, icon } = beccaService.getNoteTitleAndIcon(result.noteId);
        return {
            notePath: result.notePath,
            noteTitle: title,
            notePathTitle: result.notePathTitle,
            highlightedNotePathTitle: result.highlightedNotePathTitle,
            contentSnippet: result.contentSnippet,
            highlightedContentSnippet: result.highlightedContentSnippet,
            icon: icon ?? "bx bx-note"
        };
    });
}

/**
 * @param ignoreInternalAttributes whether to ignore certain attributes from the search such as ~internalLink.
 */
function highlightSearchResults(searchResults: SearchResult[], highlightedTokens: string[], ignoreInternalAttributes = false) {
    highlightedTokens = Array.from(new Set(highlightedTokens));

    // we remove < signs because they can cause trouble in matching and overwriting existing highlighted chunks
    // which would make the resulting HTML string invalid.
    // { and } are used for marking <b> and </b> tag (to avoid matches on single 'b' character)
    // < and > are used for marking <small> and </small>
    highlightedTokens = highlightedTokens.map((token) => token.replace("/[<\{\}]/g", "")).filter((token) => !!token?.trim());

    // sort by the longest, so we first highlight the longest matches
    highlightedTokens.sort((a, b) => (a.length > b.length ? -1 : 1));

    for (const result of searchResults) {
        result.highlightedNotePathTitle = result.notePathTitle.replace(/[<{}]/g, "");
        
        // Initialize highlighted content snippet
        if (result.contentSnippet) {
            result.highlightedContentSnippet = escapeHtml(result.contentSnippet).replace(/[<{}]/g, "");
        }
    }

    function wrapText(text: string, start: number, length: number, prefix: string, suffix: string) {
        return text.substring(0, start) + prefix + text.substr(start, length) + suffix + text.substring(start + length);
    }

    for (const token of highlightedTokens) {
        if (!token) {
            // Avoid empty tokens, which might cause an infinite loop.
            continue;
        }

        for (const result of searchResults) {
            // Reset token
            const tokenRegex = new RegExp(escapeRegExp(token), "gi");
            let match;

            // Highlight in note path title
            if (result.highlightedNotePathTitle) {
                const titleRegex = new RegExp(escapeRegExp(token), "gi");
                while ((match = titleRegex.exec(normalizeString(result.highlightedNotePathTitle))) !== null) {
                    result.highlightedNotePathTitle = wrapText(result.highlightedNotePathTitle, match.index, token.length, "{", "}");
                    // 2 characters are added, so we need to adjust the index
                    titleRegex.lastIndex += 2;
                }
            }

            // Highlight in content snippet
            if (result.highlightedContentSnippet) {
                const contentRegex = new RegExp(escapeRegExp(token), "gi");
                while ((match = contentRegex.exec(normalizeString(result.highlightedContentSnippet))) !== null) {
                    result.highlightedContentSnippet = wrapText(result.highlightedContentSnippet, match.index, token.length, "{", "}");
                    // 2 characters are added, so we need to adjust the index
                    contentRegex.lastIndex += 2;
                }
            }
        }
    }

    for (const result of searchResults) {
        if (result.highlightedNotePathTitle) {
            result.highlightedNotePathTitle = result.highlightedNotePathTitle.replace(/{/g, "<b>").replace(/}/g, "</b>");
        }
        
        if (result.highlightedContentSnippet) {
            result.highlightedContentSnippet = result.highlightedContentSnippet.replace(/{/g, "<b>").replace(/}/g, "</b>");
        }
    }
}

export default {
    searchFromNote,
    searchNotesForAutocomplete,
    findResultsWithQuery,
    findFirstNoteWithQuery,
    searchNotes
};
