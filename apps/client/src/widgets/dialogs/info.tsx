import { EventData } from "../../components/app_context";
import ReactBasicWidget from "../react/ReactBasicWidget";
import { ConfirmDialogCallback } from "./confirm";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import Modal from "../react/Modal";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import { useRef } from "preact/compat";
import { RawHtmlBlock } from "../react/RawHtml";

interface ShowInfoDialogProps {
    message?: string | HTMLElement;
    callback?: ConfirmDialogCallback;
    lastElementToFocus?: HTMLElement | null;
}

function ShowInfoDialogComponent({ message, callback, lastElementToFocus }: ShowInfoDialogProps) {
    const okButtonRef = useRef<HTMLButtonElement>(null);

    return (message && <Modal
        className="info-dialog"
        size="sm"
        title={t("info.modalTitle")}
        onHidden={() => {
            callback?.();
            lastElementToFocus?.focus();
        }}
        onShown={() => okButtonRef.current?.focus?.()}
        footer={<Button
            buttonRef={okButtonRef}
            text={t("info.okButton")}
            onClick={() => closeActiveDialog()}
        />}
    >
        <RawHtmlBlock className="info-dialog-content" html={message} />
    </Modal>);
}

export default class InfoDialog extends ReactBasicWidget {

    private props: ShowInfoDialogProps = {};

    get component() {
        return <ShowInfoDialogComponent {...this.props} />;
    }

    showInfoDialogEvent({ message, callback }: EventData<"showInfoDialog">) {
        this.props = { 
            message: Array.isArray(message) ? message[0] : message,
            callback,
            lastElementToFocus: (document.activeElement as HTMLElement)
        };
        this.doRender();
        openDialog(this.$widget);
    }

}
