import { useEffect, useState } from "preact/compat";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import FormCheckbox from "../react/FormCheckbox";
import FormFileUpload from "../react/FormFileUpload";
import FormGroup from "../react/FormGroup";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import options from "../../services/options";
import importService from "../../services/import.js";
import { EventData } from "../../components/app_context";
import tree from "../../services/tree";

interface UploadAttachmentsDialogProps {
    parentNoteId?: string;
}

function UploadAttachmentsDialogComponent({ parentNoteId }: UploadAttachmentsDialogProps) {
    const [ files, setFiles ] = useState<FileList | null>(null);
    const [ shrinkImages, setShrinkImages ] = useState(options.is("compressImages"));
    const [ isUploading, setIsUploading ] = useState(false);
    const [ description, setDescription ] = useState<string | undefined>(undefined);

    if (parentNoteId) {
        useEffect(() => {
            tree.getNoteTitle(parentNoteId).then((noteTitle) =>
                setDescription(t("upload_attachments.files_will_be_uploaded", { noteTitle })));
        }, [parentNoteId]);
    }

    return (parentNoteId &&
        <Modal
            className="upload-attachments-dialog"
            size="lg"
            title={t("upload_attachments.upload_attachments_to_note")}
            footer={<Button text={t("upload_attachments.upload")} primary disabled={!files || isUploading} />}
            onSubmit={async () => {
                if (!files) {
                    return;
                }

                setIsUploading(true);
                const filesCopy = Array.from(files);
                await importService.uploadFiles("attachments", parentNoteId, filesCopy, { shrinkImages });
                setIsUploading(false);
                closeActiveDialog();
            }}
        >
            <FormGroup label={t("upload_attachments.choose_files")} description={description}>
                <FormFileUpload onChange={setFiles} multiple />
            </FormGroup>

            <FormGroup label={t("upload_attachments.options")}>
                <FormCheckbox
                    name="shrink-images"
                    hint={t("upload_attachments.tooltip")} label={t("upload_attachments.shrink_images")}
                    currentValue={shrinkImages} onChange={setShrinkImages}
                />
            </FormGroup>
        </Modal>
    );
}

export default class UploadAttachmentsDialog extends ReactBasicWidget {

    private props: UploadAttachmentsDialogProps = {};

    get component() {
        return <UploadAttachmentsDialogComponent {...this.props} />;
    }

    showUploadAttachmentsDialogEvent({ noteId }: EventData<"showUploadAttachmentsDialog">) {
        this.props = { parentNoteId: noteId };
        this.doRender();
        openDialog(this.$widget);    
    }

}
