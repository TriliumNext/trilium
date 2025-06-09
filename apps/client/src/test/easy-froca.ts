import utils from "../services/utils.js";
import FNote from "../entities/fnote.js";
import froca from "../services/froca.js";
import FAttribute from "../entities/fattribute.js";
import noteAttributeCache from "../services/note_attribute_cache.js";

type AttributeDefinitions = { [key in `#${string}`]: string; };
type RelationDefinitions = { [key in `~${string}`]: string; };

interface NoteDefinition extends AttributeDefinitions, RelationDefinitions {
    id?: string | undefined;
    title: string;
}

/**
 * Creates the given notes with the given title and optionally one or more attributes.
 *
 * For a label to be created, simply pass on a key prefixed with `#` and any desired value.
 *
 * The notes and attributes will be injected in the froca.
 *
 * @param notes
 * @returns an array containing the IDs of the created notes.
 * @example
 * buildNotes([
 *  { title: "A", "#startDate": "2025-05-05" },
 *  { title: "B", "#startDate": "2025-05-07" }
 * ]);
 */
export function buildNotes(notes: NoteDefinition[]) {
    const ids: string[] = [];

    for (const noteDef of notes) {
        ids.push(buildNote(noteDef).noteId);
    }

    return ids;
}

export function buildNote(noteDef: NoteDefinition) {
    const note = new FNote(froca, {
        noteId: noteDef.id ?? utils.randomString(12),
        title: noteDef.title,
        type: "text",
        mime: "text/html",
        isProtected: false,
        blobId: ""
    });
    froca.notes[note.noteId] = note;

    let position = 0;
    for (const [ key, value ] of Object.entries(noteDef)) {
        const attributeId = utils.randomString(12);
        const name = key.substring(1);

        let attribute: FAttribute | null = null;
        if (key.startsWith("#")) {
            attribute = new FAttribute(froca, {
                noteId: note.noteId,
                attributeId,
                type: "label",
                name,
                value,
                position,
                isInheritable: false
            });
        }

        if (key.startsWith("~")) {
            attribute = new FAttribute(froca, {
                noteId: note.noteId,
                attributeId,
                type: "relation",
                name,
                value,
                position,
                isInheritable: false
            });
        }

        if (!attribute) {
            continue;
        }

        froca.attributes[attributeId] = attribute;
        note.attributes.push(attributeId);
        position++;

        // Inject the attribute into the note attribute cache, since FNote.getAttribute() doesn't always work.
        // If we add support for templates into froca, this might cause issues.
        if (!noteAttributeCache.attributes[note.noteId]) {
            noteAttributeCache.attributes[note.noteId] = [];
        }
        noteAttributeCache.attributes[note.noteId].push(attribute);
    }
    return note;
}
