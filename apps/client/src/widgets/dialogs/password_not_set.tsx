import { closeActiveDialog, openDialog } from "../../services/dialog";
import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import { t } from "../../services/i18n";
import Button from "../react/Button";
import appContext from "../../components/app_context";

function PasswordNotSetDialogComponent() {
    return (
        <Modal
            size="md" className="password-not-set-dialog"
            title={t("password_not_set.title")}
            footer={<Button icon="bx bx-lock" text={t("password_not_set.go_to_password_options")} onClick={() => {
                closeActiveDialog();
                appContext.triggerCommand("showOptions", { section: "_optionsPassword" });
            }} />}
        >
            <p>{t("password_not_set.body1")}</p>
            <p>{t("password_not_set.body2")}</p>
        </Modal>
    );
}

export default class PasswordNotSetDialog extends ReactBasicWidget {

    get component() {
        return <PasswordNotSetDialogComponent />;
    }

    showPasswordNotSetEvent() {
        openDialog(this.$widget);
    }

}
