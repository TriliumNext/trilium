import becca from '../../../becca/becca.js';
import type BNote from '../../../becca/entities/bnote.js';
import { LLM_CONSTANTS } from '../constants/provider_constants.js';
import log from '../../log.js';

/**
 * Check if a note should be excluded from all AI/LLM features
 *
 * @param note - The note to check (BNote object)
 * @returns true if the note should be excluded from AI features
 */
export function isNoteExcludedFromAI(note: BNote): boolean {
    if (!note) {
        return false;
    }

    try {
        // Check if the note has the AI exclusion label
        const hasExclusionLabel = note.hasLabel(LLM_CONSTANTS.AI_EXCLUSION.LABEL_NAME);

        if (hasExclusionLabel) {
            log.info(`Note ${note.noteId} (${note.title}) excluded from AI features due to ${LLM_CONSTANTS.AI_EXCLUSION.LABEL_NAME} label`);
            return true;
        }

        return false;
    } catch (error) {
        log.error(`Error checking AI exclusion for note ${note.noteId}: ${error}`);
        return false; // Default to not excluding on error
    }
}

/**
 * Check if a note should be excluded from AI features by noteId
 *
 * @param noteId - The ID of the note to check
 * @returns true if the note should be excluded from AI features
 */
export function isNoteExcludedFromAIById(noteId: string): boolean {
    if (!noteId) {
        return false;
    }

    try {
        const note = becca.getNote(noteId);
        if (!note) {
            return false;
        }
        return isNoteExcludedFromAI(note);
    } catch (error) {
        log.error(`Error checking AI exclusion for note ID ${noteId}: ${error}`);
        return false; // Default to not excluding on error
    }
}

/**
 * Filter out notes that are excluded from AI features
 *
 * @param notes - Array of notes to filter
 * @returns Array of notes with AI-excluded notes removed
 */
export function filterAIExcludedNotes(notes: BNote[]): BNote[] {
    return notes.filter(note => !isNoteExcludedFromAI(note));
}

/**
 * Filter out note IDs that are excluded from AI features
 *
 * @param noteIds - Array of note IDs to filter
 * @returns Array of note IDs with AI-excluded notes removed
 */
export function filterAIExcludedNoteIds(noteIds: string[]): string[] {
    return noteIds.filter(noteId => !isNoteExcludedFromAIById(noteId));
}

/**
 * Check if any notes in an array are excluded from AI features
 *
 * @param notes - Array of notes to check
 * @returns true if any note should be excluded from AI features
 */
export function hasAIExcludedNotes(notes: BNote[]): boolean {
    return notes.some(note => isNoteExcludedFromAI(note));
}

/**
 * Get the AI exclusion label name from constants
 * This can be used in UI components or other places that need to reference the label
 *
 * @returns The label name used for AI exclusion
 */
export function getAIExclusionLabelName(): string {
    return LLM_CONSTANTS.AI_EXCLUSION.LABEL_NAME;
}
