import { useRef, useState } from "preact/hooks";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import Modal from "../react/Modal";
import { Modal as BootstrapModal } from "bootstrap";
import ReactBasicWidget from "../react/ReactBasicWidget";
import FormTextBox from "../react/FormTextBox";
import FormGroup from "../react/FormGroup";
import { refToJQuerySelector } from "../react/react_utils";

// JQuery here is maintained for compatibility with existing code.
interface ShownCallbackData {
    $dialog: JQuery<HTMLDivElement>;
    $question: JQuery<HTMLLabelElement> | null;
    $answer: JQuery<HTMLElement> | null;
    $form: JQuery<HTMLFormElement>;
}

export type PromptShownDialogCallback = ((callback: ShownCallbackData) => void) | null;

export interface PromptDialogOptions {
    title?: string;
    message?: string;
    defaultValue?: string;
    shown?: PromptShownDialogCallback;
    callback?: (value: string | null) => void;
}

interface PromptDialogProps extends PromptDialogOptions { }

function PromptDialogComponent({ title, message, shown: shownCallback, callback }: PromptDialogProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);
    const answerRef = useRef<HTMLInputElement>(null);
    const [ value, setValue ] = useState("");    

    return (
        <Modal
            className="prompt-dialog"
            title={title ?? t("prompt.title")}
            size="lg"
            zIndex={2000}
            modalRef={modalRef} formRef={formRef}            
            onShown={() => {
                shownCallback?.({
                    $dialog: refToJQuerySelector(modalRef),
                    $question: refToJQuerySelector(labelRef),
                    $answer: refToJQuerySelector(answerRef),
                    $form: refToJQuerySelector(formRef)
                });
                answerRef.current?.focus();
            }}
            onSubmit={() => {
                const modal = BootstrapModal.getOrCreateInstance(modalRef.current!);
                modal.hide();

                callback?.(value);
            }}
            onHidden={() => callback?.(null)}
            footer={<Button text={t("prompt.ok")} keyboardShortcut="Enter" primary />}
        >
            <FormGroup label={message} labelRef={labelRef}>
                <FormTextBox
                    name="prompt-dialog-answer"
                    inputRef={answerRef}
                    currentValue={value} onChange={setValue} />
            </FormGroup>
        </Modal>
    );
}

export default class PromptDialog extends ReactBasicWidget {

    private props: PromptDialogProps = {};

    get component() {
        return <PromptDialogComponent {...this.props} />;
    }

    showPromptDialogEvent(props: PromptDialogOptions) {
        this.props = props;
        this.doRender();
        openDialog(this.$widget, false);
    }

}
