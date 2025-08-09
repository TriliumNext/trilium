import { useRef, useState } from "preact/hooks";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import FormTextBox from "../react/FormTextBox";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import protected_session from "../../services/protected_session";

function ProtectedSessionPasswordDialogComponent() {
    const [ password, setPassword ] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <Modal
            className="protected-session-password-dialog"
            title={t("protected_session_password.modal_title")}
            size="md"
            helpPageId="bwg0e8ewQMak"
            footer={<Button text={t("protected_session_password.start_button")} />}
            onSubmit={() => protected_session.setupProtectedSession(password)}
            onShown={() => inputRef.current?.focus()}
        >
            <label htmlFor="protected-session-password" className="col-form-label">{t("protected_session_password.form_label")}</label>
            <FormTextBox
                id="protected-session-password"
                name="protected-session-password"
                type="password"
                autoComplete="current-password"
                onChange={setPassword}
            />
        </Modal>
    )
}

export default class ProtectedSessionPasswordDialog extends ReactBasicWidget {

    get component() {
        return <ProtectedSessionPasswordDialogComponent />;
    }

    showProtectedSessionPasswordDialogEvent() {
        openDialog(this.$widget);
    }

    closeProtectedSessionPasswordDialogEvent() {
        closeActiveDialog();
    }

}