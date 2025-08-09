import { useRef, useState } from "preact/hooks";
import appContext from "../../components/app_context.js";
import { closeActiveDialog, openDialog } from "../../services/dialog.js";
import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import toast from "../../services/toast.js";
import Modal from "../react/Modal.jsx";
import ReactBasicWidget from "../react/ReactBasicWidget.js";
import froca from "../../services/froca.js";
import tree from "../../services/tree.js";
import FBranch from "../../entities/fbranch.js";
import Button from "../react/Button.jsx";
import FormGroup from "../react/FormGroup.js";

interface BranchPrefixDialogProps {
    branch?: FBranch;
}

function BranchPrefixDialogComponent({ branch }: BranchPrefixDialogProps) {
    const [ prefix, setPrefix ] = useState(branch?.prefix ?? "");
    const branchInput = useRef<HTMLInputElement>(null);

    async function onSubmit() {
        if (!branch) {
            return;
        }

        savePrefix(branch.branchId, prefix);
        closeActiveDialog();
    }

    return (
        <Modal
            className="branch-prefix-dialog"
            title={t("branch_prefix.edit_branch_prefix")}
            size="lg"
            onShown={() => branchInput.current?.focus()}
            onSubmit={onSubmit}
            helpPageId="TBwsyfadTA18"
            footer={<Button text={t("branch_prefix.save")} />}
        >
            <FormGroup label={t("branch_prefix.prefix")}>
                <div class="input-group">
                    <input class="branch-prefix-input form-control" value={prefix} ref={branchInput}
                        onChange={(e) => setPrefix((e.target as HTMLInputElement).value)} />
                    <div class="branch-prefix-note-title input-group-text"> - {branch && branch.getNoteFromCache().title}</div>
                </div>
            </FormGroup>
        </Modal>
    );
}

export default class BranchPrefixDialog extends ReactBasicWidget {
    private branch?: FBranch;

    get component() {
        return <BranchPrefixDialogComponent branch={this.branch} />;
    }

    async editBranchPrefixEvent() {
        const notePath = appContext.tabManager.getActiveContextNotePath();
        if (!notePath) {
            return;
        }

        const { noteId, parentNoteId } = tree.getNoteIdAndParentIdFromUrl(notePath);

        if (!noteId || !parentNoteId) {
            return;
        }

        const newBranchId = await froca.getBranchId(parentNoteId, noteId);
        if (!newBranchId) {
            return;
        }    
        const parentNote = await froca.getNote(parentNoteId);
        if (!parentNote || parentNote.type === "search") {
            return;
        }

        this.branch = froca.getBranch(newBranchId);

        // Re-render the component with the new notePath
        this.doRender();
        openDialog(this.$widget);
    }

}

async function savePrefix(branchId: string, prefix: string) {
    await server.put(`branches/${branchId}/set-prefix`, { prefix: prefix });
    toast.showMessage(t("branch_prefix.branch_prefix_saved"));
}