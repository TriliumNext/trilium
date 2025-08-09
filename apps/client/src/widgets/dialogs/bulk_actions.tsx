import { useEffect, useState } from "preact/hooks";
import { EventData } from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import "./bulk_actions.css";
import { BulkActionAffectedNotes } from "@triliumnext/commons";
import server from "../../services/server";
import FormCheckbox from "../react/FormCheckbox";
import Button from "../react/Button";
import bulk_action from "../../services/bulk_action";
import toast from "../../services/toast";
import RenameNoteBulkAction from "../bulk_actions/note/rename_note";
import { RawHtmlBlock } from "../react/RawHtml";
import FNote from "../../entities/fnote";
import froca from "../../services/froca";
import useTriliumEvent from "../react/hooks";

interface BulkActionProps {
    bulkActionNote?: FNote | null;
    selectedOrActiveNoteIds?: string[];
}

function BulkActionComponent({ selectedOrActiveNoteIds, bulkActionNote }: BulkActionProps) {
    const [ includeDescendants, setIncludeDescendants ] = useState(false);
    const [ affectedNoteCount, setAffectedNoteCount ] = useState(0);
    const [ existingActions, setExistingActions ] = useState<RenameNoteBulkAction[]>([]);

    if (!selectedOrActiveNoteIds || !bulkActionNote) {
        return;
    }

    useEffect(() => {
        server.post<BulkActionAffectedNotes>("bulk-action/affected-notes", {
            noteIds: selectedOrActiveNoteIds,
            includeDescendants
        }).then(({ affectedNoteCount }) => setAffectedNoteCount(affectedNoteCount));
    }, [ selectedOrActiveNoteIds, includeDescendants ]);

    function refreshExistingActions() {
        setExistingActions(bulk_action.parseActions(bulkActionNote!));
    }

    useEffect(() => refreshExistingActions(), []);
    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows().find((row) =>
            row.type === "label" && row.name === "action" && row.noteId === "_bulkAction")) {
            refreshExistingActions();
        }
    });

    return ( selectedOrActiveNoteIds &&
        <Modal
            className="bulk-actions-dialog"
            size="xl"
            title={t("bulk_actions.bulk_actions")}
            footer={<Button text={t("bulk_actions.execute_bulk_actions")} primary />}
            onSubmit={async () => {
                await server.post("bulk-action/execute", {
                    noteIds: selectedOrActiveNoteIds,
                    includeDescendants
                });

                toast.showMessage(t("bulk_actions.bulk_actions_executed"), 3000);
                closeActiveDialog();
            }}
        >
            <h4>{t("bulk_actions.affected_notes")}: <span>{affectedNoteCount}</span></h4>
            <FormCheckbox 
                name="include-descendants" label={t("bulk_actions.include_descendants")}
                currentValue={includeDescendants} onChange={setIncludeDescendants}
            />

            <h4>{t("bulk_actions.available_actions")}</h4>
            <AvailableActionsList />

            <h4>{t("bulk_actions.chosen_actions")}</h4>
            <ExistingActionsList existingActions={existingActions} />
        </Modal>
    )
}

function AvailableActionsList() {
    return <table class="bulk-available-action-list">
        {bulk_action.ACTION_GROUPS.map((actionGroup) => {
            return (
                <tr>
                    <td>{ actionGroup.title }:</td>
                    {actionGroup.actions.map(({ actionName, actionTitle }) =>
                        <Button
                            small text={actionTitle}
                            onClick={() => bulk_action.addAction("_bulkAction", actionName)}
                        />
                    )}
                </tr>
            );
        })}
    </table>;
}

function ExistingActionsList({ existingActions }: { existingActions?: RenameNoteBulkAction[] }) {
    return (
        <table class="bulk-existing-action-list">
            { existingActions
                ? existingActions
                    .map(action => action.doRender())
                    .filter(renderedAction => renderedAction !== null)            
                : <p>{t("bulk_actions.none_yet")}</p>
            }
        </table>
    );
}

export default class BulkActionsDialog extends ReactBasicWidget {

    private props: BulkActionProps = {};

    get component() {
        return <BulkActionComponent {...this.props} />
    }

    async openBulkActionsDialogEvent({ selectedOrActiveNoteIds }: EventData<"openBulkActionsDialog">) {                
        this.props = {
            selectedOrActiveNoteIds,
            bulkActionNote: await froca.getNote("_bulkAction")
        };
        this.doRender();
        openDialog(this.$widget);
    }

}