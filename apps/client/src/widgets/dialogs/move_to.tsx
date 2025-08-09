import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import { t } from "../../services/i18n";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { EventData } from "../../components/app_context";
import NoteList from "../react/NoteList";
import FormGroup from "../react/FormGroup";
import NoteAutocomplete from "../react/NoteAutocomplete";
import Button from "../react/Button";
import { useRef, useState } from "preact/compat";
import { Suggestion, triggerRecentNotes } from "../../services/note_autocomplete";
import tree from "../../services/tree";
import froca from "../../services/froca";
import branches from "../../services/branches";
import toast from "../../services/toast";

interface MoveToDialogProps {
    movedBranchIds?: string[];
}

function MoveToDialogComponent({ movedBranchIds }: MoveToDialogProps) {
    const [ suggestion, setSuggestion ] = useState<Suggestion | null>(null);
    const autoCompleteRef = useRef<HTMLInputElement>(null);

    async function onSubmit() {
        const notePath = suggestion?.notePath;
        if (!notePath) {
            logError(t("move_to.error_no_path"));
            return;
        }

        closeActiveDialog();
        const { noteId, parentNoteId } = tree.getNoteIdAndParentIdFromUrl(notePath);
        if (!parentNoteId) {
            return;
        }

        const branchId = await froca.getBranchId(parentNoteId, noteId);
        if (branchId) {
            moveNotesTo(movedBranchIds, branchId);
        }
    }

    return (
        <Modal
            className="move-to-dialog"
            size="lg" maxWidth={1000}
            title={t("move_to.dialog_title")}
            footer={<Button text={t("move_to.move_button")} keyboardShortcut="Enter" />}
            onSubmit={onSubmit}
            onShown={() => triggerRecentNotes(autoCompleteRef.current)}
        >
            <h5>{t("move_to.notes_to_move")}</h5>
            <NoteList branchIds={movedBranchIds} />

            <FormGroup label={t("move_to.target_parent_note")}>
                <NoteAutocomplete
                    onChange={setSuggestion}
                    inputRef={autoCompleteRef}
                />
            </FormGroup>
        </Modal>
    )
}

export default class MoveToDialog extends ReactBasicWidget {

    private props: MoveToDialogProps = {};

    get component() {
        return <MoveToDialogComponent {...this.props} />;
    }

    async moveBranchIdsToEvent({ branchIds }: EventData<"moveBranchIdsTo">) {
        const movedBranchIds = branchIds;
        this.props = { movedBranchIds };
        this.doRender();
        openDialog(this.$widget);
    }

}

async function moveNotesTo(movedBranchIds: string[] | undefined, parentBranchId: string) {
    if (movedBranchIds) {
        await branches.moveToParentNote(movedBranchIds, parentBranchId);
    }

    const parentBranch = froca.getBranch(parentBranchId);
    const parentNote = await parentBranch?.getNote();

    toast.showMessage(`${t("move_to.move_success_message")} ${parentNote?.title}`);
}