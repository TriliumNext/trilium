import { useState } from "preact/hooks";
import { EventData } from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import tree from "../../services/tree";
import Button from "../react/Button";
import FormRadioGroup from "../react/FormRadioGroup";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import "./export.css";
import ws from "../../services/ws";
import toastService, { ToastOptions } from "../../services/toast";
import utils from "../../services/utils";
import open from "../../services/open";
import froca from "../../services/froca";

interface ExportDialogProps {
    branchId?: string | null;
    noteTitle?: string;
    defaultType?: "subtree" | "single";
}

function ExportDialogComponent({ branchId, noteTitle, defaultType }: ExportDialogProps) {
    const [ exportType, setExportType ] = useState<string>(defaultType ?? "subtree");
    const [ subtreeFormat, setSubtreeFormat ] = useState<string>("html");
    const [ singleFormat, setSingleFormat ] = useState<string>("html");
    const [ opmlVersion, setOpmlVersion ] = useState<string>("2.0");

    return (branchId &&
        <Modal
            className="export-dialog"
            title={`${t("export.export_note_title")} ${noteTitle ?? ""}`}
            size="lg"
            onSubmit={() => {
                const format = (exportType === "subtree" ? subtreeFormat : singleFormat);
                const version = (format === "opml" ? opmlVersion : "1.0");
                exportBranch(branchId, exportType, format, version);
                closeActiveDialog();
            }}
            footer={<Button className="export-button" text={t("export.export")} primary />}
        >

            <FormRadioGroup
                name="export-type"
                currentValue={exportType} onChange={setExportType}
                values={[{
                    value: "subtree",
                    label: t("export.export_type_subtree")
                }]}
            />

            { exportType === "subtree" &&
                <div className="export-subtree-formats format-choice">
                    <FormRadioGroup
                        name="export-subtree-format"
                        currentValue={subtreeFormat} onChange={setSubtreeFormat}
                        values={[
                            { value: "html", label: t("export.format_html_zip") },
                            { value: "markdown", label: t("export.format_markdown") },
                            { value: "opml", label: t("export.format_opml") }
                        ]}
                    />

                    { subtreeFormat === "opml" &&
                        <div className="opml-versions">
                            <FormRadioGroup
                                name="opml-version"
                                currentValue={opmlVersion} onChange={setOpmlVersion}
                                values={[
                                    { value: "1.0", label: t("export.opml_version_1") },
                                    { value: "2.0", label: t("export.opml_version_2") }
                                ]}
                            />
                        </div>
                    }
                </div>
            }

            <FormRadioGroup
                name="export-type"
                currentValue={exportType} onChange={setExportType}
                values={[{
                    value: "single",
                    label: t("export.export_type_single")
                }]}
            />

            { exportType === "single" &&
                <div class="export-single-formats format-choice">
                    <FormRadioGroup
                        name="export-single-format"
                        currentValue={singleFormat} onChange={setSingleFormat}
                        values={[
                            { value: "html", label: t("export.format_html") },
                            { value: "markdown", label: t("export.format_markdown") }
                        ]}
                    />
                </div>
            }

        </Modal>
    );
}

export default class ExportDialog extends ReactBasicWidget {

    private props: ExportDialogProps = {};

    get component() {
        return <ExportDialogComponent {...this.props} />
    }

    async showExportDialogEvent({ notePath, defaultType }: EventData<"showExportDialog">) {
        const { noteId, parentNoteId } = tree.getNoteIdAndParentIdFromUrl(notePath);
        if (!parentNoteId) {
            return;
        }

        const branchId = await froca.getBranchId(parentNoteId, noteId);

        this.props = {
            noteTitle: noteId && await tree.getNoteTitle(noteId),
            defaultType,
            branchId
        };
        this.doRender();
        
        openDialog(this.$widget);
    }
}

function exportBranch(branchId: string, type: string, format: string, version: string) {
    const taskId = utils.randomString(10);
    const url = open.getUrlForDownload(`api/branches/${branchId}/export/${type}/${format}/${version}/${taskId}`);
    open.download(url);
}

ws.subscribeToMessages(async (message) => {
    function makeToast(id: string, message: string): ToastOptions {
        return {
            id: id,
            title: t("export.export_status"),
            message: message,
            icon: "arrow-square-up-right"
        };
    }

    if (message.taskType !== "export") {
        return;
    }

    if (message.type === "taskError") {
        toastService.closePersistent(message.taskId);
        toastService.showError(message.message);
    } else if (message.type === "taskProgressCount") {
        toastService.showPersistent(makeToast(message.taskId, t("export.export_in_progress", { progressCount: message.progressCount })));
    } else if (message.type === "taskSucceeded") {
        const toast = makeToast(message.taskId, t("export.export_finished_successfully"));
        toast.closeAfter = 5000;

        toastService.showPersistent(toast);
    }
});