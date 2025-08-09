import { useState } from "preact/hooks";
import { EventData } from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import tree from "../../services/tree";
import Button from "../react/Button";
import FormCheckbox from "../react/FormCheckbox";
import FormFileUpload from "../react/FormFileUpload";
import FormGroup from "../react/FormGroup";
import Modal from "../react/Modal";
import RawHtml from "../react/RawHtml";
import ReactBasicWidget from "../react/ReactBasicWidget";
import importService, { UploadFilesOptions } from "../../services/import";

interface ImportDialogComponentProps {
    parentNoteId?: string;
    noteTitle?: string;
}

function ImportDialogComponent({  parentNoteId, noteTitle }: ImportDialogComponentProps) {
    const [ files, setFiles ] = useState<FileList | null>(null);
    const [ safeImport, setSafeImport ] = useState(true);
    const [ explodeArchives, setExplodeArchives ] = useState(true);
    const [ shrinkImages, setShrinkImages ] = useState(true);
    const [ textImportedAsText, setTextImportedAsText ] = useState(true);
    const [ codeImportedAsCode, setCodeImportedAsCode ] = useState(true);
    const [ replaceUnderscoresWithSpaces, setReplaceUnderscoresWithSpaces ] = useState(true);

    return (parentNoteId &&
        <Modal
            className="import-dialog"
            size="lg"
            title={t("import.importIntoNote")}
            onSubmit={async () => {
                if (!files) {
                    return;
                }                

                const options: UploadFilesOptions = {
                    safeImport: boolToString(safeImport),
                    shrinkImages: boolToString(shrinkImages),
                    textImportedAsText: boolToString(textImportedAsText),
                    codeImportedAsCode: boolToString(codeImportedAsCode),
                    explodeArchives: boolToString(explodeArchives),
                    replaceUnderscoresWithSpaces: boolToString(replaceUnderscoresWithSpaces)
                };

                closeActiveDialog();
                await importService.uploadFiles("notes", parentNoteId, Array.from(files), options);
            }}
            footer={<Button text={t("import.import")} primary disabled={!files} />}
        >
            <FormGroup label={t("import.chooseImportFile")} description={<>{t("import.importDescription")} <strong>{ noteTitle }</strong></>}>
                <FormFileUpload multiple onChange={setFiles} />
            </FormGroup>

            <FormGroup label={t("import.options")}>
                <FormCheckbox
                    name="safe-import" hint={t("import.safeImportTooltip")} label={t("import.safeImport")}
                    currentValue={safeImport} onChange={setSafeImport}
                />
                <FormCheckbox
                    name="explode-archives" hint={t("import.explodeArchivesTooltip")} label={<RawHtml html={t("import.explodeArchives")} />}
                    currentValue={explodeArchives} onChange={setExplodeArchives}
                />
                <FormCheckbox
                    name="shrink-images" hint={t("import.shrinkImagesTooltip")} label={t("import.shrinkImages")}
                    currentValue={shrinkImages} onChange={setShrinkImages}
                />
                <FormCheckbox
                    name="text-imported-as-text" label={t("import.textImportedAsText")}
                    currentValue={textImportedAsText} onChange={setTextImportedAsText}
                />
                <FormCheckbox
                    name="code-imported-as-code" label={<RawHtml html={t("import.codeImportedAsCode")} />}
                    currentValue={codeImportedAsCode} onChange={setCodeImportedAsCode}
                />
                <FormCheckbox
                    name="replace-underscores-with-spaces" label={t("import.replaceUnderscoresWithSpaces")} 
                    currentValue={replaceUnderscoresWithSpaces} onChange={setReplaceUnderscoresWithSpaces}
                />
            </FormGroup>
        </Modal>
    );
}

export default class ImportDialog extends ReactBasicWidget {

    private props?: ImportDialogComponentProps = {};

    get component() {
        return <ImportDialogComponent {...this.props} />
    }

    async showImportDialogEvent({ noteId }: EventData<"showImportDialog">) {
        this.props = {
            parentNoteId: noteId,
            noteTitle: await tree.getNoteTitle(noteId)
        }
        this.doRender();

        openDialog(this.$widget);
    }

}

function boolToString(value: boolean) {
    return value ? "true" : "false";
}