import { useRef, useState } from "preact/compat";
import appContext from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import server from "../../services/server";
import toast from "../../services/toast";
import utils from "../../services/utils";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import Button from "../react/Button";

interface RenderMarkdownResponse {
    htmlContent: string;
}

function MarkdownImportDialogComponent() {
    const markdownImportTextArea = useRef<HTMLTextAreaElement>(null);
    let [ text, setText ] = useState("");  

    async function sendForm() {
        await convertMarkdownToHtml(text);
        setText("");
        closeActiveDialog();
    }

    return (
        <Modal
            className="markdown-import-dialog" title={t("markdown_import.dialog_title")} size="lg"
            footer={<Button className="markdown-import-button" text={t("markdown_import.import_button")} onClick={sendForm} keyboardShortcut="Ctrl+Space" />}
            onShown={() => markdownImportTextArea.current?.focus()}
        >
            <p>{t("markdown_import.modal_body_text")}</p>
            <textarea ref={markdownImportTextArea} value={text}
                onInput={(e) => setText(e.currentTarget.value)}
                style={{ height: 340, width: "100%" }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                        e.preventDefault();
                        sendForm();
                    }
                }}></textarea>
        </Modal>
    )
}

export default class MarkdownImportDialog extends ReactBasicWidget {

    get component() {
        return <MarkdownImportDialogComponent />;
    }

    async importMarkdownInlineEvent() {
        if (appContext.tabManager.getActiveContextNoteType() !== "text") {
            return;
        }

        if (utils.isElectron()) {
            const { clipboard } = utils.dynamicRequire("electron");
            const text = clipboard.readText();

            convertMarkdownToHtml(text);
        } else {
            openDialog(this.$widget);
        }
    }

    async pasteMarkdownIntoTextEvent() {
        // BC with keyboard shortcuts command
        await this.importMarkdownInlineEvent();
    }

}

async function convertMarkdownToHtml(markdownContent: string) {
    const { htmlContent } = await server.post<RenderMarkdownResponse>("other/render-markdown", { markdownContent });

    const textEditor = await appContext.tabManager.getActiveContext()?.getTextEditor();
    if (!textEditor) {
        return;
    }

    const viewFragment = textEditor.data.processor.toView(htmlContent);
    const modelFragment = textEditor.data.toModel(viewFragment);

    textEditor.model.insertContent(modelFragment, textEditor.model.document.selection);
    textEditor.editing.view.focus();

    toast.showMessage(t("markdown_import.import_success"));
}