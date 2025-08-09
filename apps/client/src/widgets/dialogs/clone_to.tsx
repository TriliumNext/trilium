import { useRef, useState } from "preact/compat";
import appContext, { EventData } from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import NoteAutocomplete from "../react/NoteAutocomplete";
import froca from "../../services/froca";
import FormGroup from "../react/FormGroup";
import FormTextBox from "../react/FormTextBox";
import Button from "../react/Button";
import { Suggestion, triggerRecentNotes } from "../../services/note_autocomplete";
import { logError } from "../../services/ws";
import tree from "../../services/tree";
import branches from "../../services/branches";
import toast from "../../services/toast";
import NoteList from "../react/NoteList";

interface CloneToDialogProps {
    clonedNoteIds?: string[];
}

function CloneToDialogComponent({ clonedNoteIds }: CloneToDialogProps) {
    const [ prefix, setPrefix ] = useState("");
    const [ suggestion, setSuggestion ] = useState<Suggestion | null>(null);
    const autoCompleteRef = useRef<HTMLInputElement>(null);

    function onSubmit() {
        if (!clonedNoteIds) {
            return;
        }

        const notePath = suggestion?.notePath;
        if (!notePath) {
            logError(t("clone_to.no_path_to_clone_to"));
            return;
        }

        closeActiveDialog();
        cloneNotesTo(notePath, clonedNoteIds, prefix);
    }

    return (
        <Modal
            className="clone-to-dialog"
            title={t("clone_to.clone_notes_to")}
            helpPageId="IakOLONlIfGI"
            size="lg"
            footer={<Button text={t("clone_to.clone_to_selected_note")} keyboardShortcut="Enter" />}
            onSubmit={onSubmit}
            onShown={() => triggerRecentNotes(autoCompleteRef.current)}
        >
            <h5>{t("clone_to.notes_to_clone")}</h5>
            <NoteList style={{ maxHeight: "200px", overflow: "auto" }} noteIds={clonedNoteIds} />
            <FormGroup label={t("clone_to.target_parent_note")}>
                <NoteAutocomplete
                    placeholder={t("clone_to.search_for_note_by_its_name")}
                    onChange={setSuggestion}
                    inputRef={autoCompleteRef}
                />      
            </FormGroup>
            <FormGroup label={t("clone_to.prefix_optional")} title={t("clone_to.cloned_note_prefix_title")}>
                <FormTextBox name="clone-prefix" onChange={setPrefix} />
            </FormGroup>
        </Modal>
    )
}

export default class CloneToDialog extends ReactBasicWidget {
    
    private props: CloneToDialogProps = {};

    get component() {
        return <CloneToDialogComponent {...this.props} />;
    }

    async cloneNoteIdsToEvent({ noteIds }: EventData<"cloneNoteIdsTo">) {
        if (!noteIds || noteIds.length === 0) {
            noteIds = [appContext.tabManager.getActiveContextNoteId() ?? ""];
        }

        const clonedNoteIds: string[] = [];

        for (const noteId of noteIds) {
            if (!clonedNoteIds.includes(noteId)) {
                clonedNoteIds.push(noteId);
            }
        }

        this.props = { clonedNoteIds };
        this.doRender();
        openDialog(this.$widget);
    }

}

async function cloneNotesTo(notePath: string, clonedNoteIds: string[], prefix?: string) {
    const { noteId, parentNoteId } = tree.getNoteIdAndParentIdFromUrl(notePath);
    if (!noteId || !parentNoteId) {
        return;
    }

    const targetBranchId = await froca.getBranchId(parentNoteId, noteId);
    if (!targetBranchId || !clonedNoteIds) {
        return;
    }

    for (const cloneNoteId of clonedNoteIds) {
        await branches.cloneNoteToBranch(cloneNoteId, targetBranchId, prefix);

        const clonedNote = await froca.getNote(cloneNoteId);
        const targetBranch = froca.getBranch(targetBranchId);
        if (!clonedNote || !targetBranch) {
            continue;
        }
        const targetNote = await targetBranch.getNote();
        if (!targetNote) {
            continue;
        }

        toast.showMessage(t("clone_to.note_cloned", { clonedTitle: clonedNote.title, targetTitle: targetNote.title }));
    }
}