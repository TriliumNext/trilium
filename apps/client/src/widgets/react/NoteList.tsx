import { useEffect, useState } from "preact/hooks";
import type FNote from "../../entities/fnote";
import froca from "../../services/froca";
import { CSSProperties } from "preact/compat";

interface NoteListProps {
    noteIds?: string[];
    branchIds?: string[];
    style?: CSSProperties;
}

export default function NoteList({ noteIds, branchIds, style }: NoteListProps) {
    const [ notes, setNotes ] = useState<FNote[]>([]);

    useEffect(() => {
        let notesToLoad: string[];
        if (noteIds) {
            notesToLoad = noteIds;
        } else if (branchIds) {
            notesToLoad = froca.getBranches(branchIds).map(b => b.noteId);
        } else {
            notesToLoad = [];
        }
        froca.getNotes(notesToLoad).then((notes) => setNotes(notes));
    }, [noteIds, branchIds]);

    return (notes &&
        <ul style={style}>
            {notes.map(note => (
                <li key={note.noteId}>
                    {note.title}
                </li>
            ))}
        </ul>
    );
}