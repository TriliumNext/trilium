import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import Button from "../react/Button";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import { useState } from "react";
import FormCheckbox from "../react/FormCheckbox";

interface ConfirmDialogProps {
    title?: string;
    message?: string | HTMLElement;
    callback?: ConfirmDialogCallback;
    lastElementToFocus?: HTMLElement | null;
    isConfirmDeleteNoteBox?: boolean;   
}

function ConfirmDialogComponent({ title, message, callback, lastElementToFocus, isConfirmDeleteNoteBox }: ConfirmDialogProps) {
    const [ confirmed, setConfirmed ] = useState<boolean>(false);
    const [ isDeleteNoteChecked, setIsDeleteNoteChecked ] = useState<boolean>(false);

    return ( 
        <Modal
            className="confirm-dialog"
            title={title ?? t("confirm.confirmation")}
            size="md"
            zIndex={2000}
            scrollable={true}
            onHidden={() => {
                callback?.({
                    confirmed,
                    isDeleteNoteChecked
                });
                lastElementToFocus?.focus();
            }}
            footer={<>
                <Button text={t("confirm.cancel")} onClick={() => closeActiveDialog()} />
                <Button text={t("confirm.ok")} onClick={() => {
                    setConfirmed(true);
                    closeActiveDialog();
                }} />
            </>}
        >
            {!message || typeof message === "string"
                ? <div>{(message as string) ?? ""}</div>
                : <div dangerouslySetInnerHTML={{ __html: message.outerHTML ?? "" }} />}

            {isConfirmDeleteNoteBox && (
                <FormCheckbox
                    name="confirm-dialog-delete-note"
                    label={t("confirm.also_delete_note")}
                    hint={t("confirm.if_you_dont_check")}
                    currentValue={isDeleteNoteChecked} onChange={setIsDeleteNoteChecked} />
            )}
        </Modal>
    );
}

export type ConfirmDialogResult = false | ConfirmDialogOptions;
export type ConfirmDialogCallback = (val?: ConfirmDialogResult) => void;
type MessageType = string | HTMLElement | JQuery<HTMLElement>;

export interface ConfirmDialogOptions {
    confirmed: boolean;
    isDeleteNoteChecked: boolean;
}

export interface ConfirmWithMessageOptions {
    message: MessageType;
    callback: ConfirmDialogCallback;
}

// For "showConfirmDialog"
export interface ConfirmWithTitleOptions {
    title: string;
    callback: ConfirmDialogCallback;
}

export default class ConfirmDialog extends ReactBasicWidget {

    private props: ConfirmDialogProps = {};

    get component() {
        return <ConfirmDialogComponent {...this.props} />;
    }

    showConfirmDialogEvent({ message, callback }: ConfirmWithMessageOptions) {
        this.showDialog(null, message, callback, false);        
    }

    showConfirmDeleteNoteBoxWithNoteDialogEvent({ title, callback }: ConfirmWithTitleOptions) {
        const message = t("confirm.are_you_sure_remove_note", { title: title });
        this.showDialog(title, message, callback, true);
    }

    private showDialog(title: string | null, message: MessageType, callback: ConfirmDialogCallback, isConfirmDeleteNoteBox: boolean) {
        this.props = {
            title: title ?? undefined,
            message: (typeof message === "object" && "length" in message ? message[0] : message),
            lastElementToFocus: (document.activeElement as HTMLElement),
            callback,
            isConfirmDeleteNoteBox
        };
        this.doRender();
        openDialog(this.$widget);
    }

}