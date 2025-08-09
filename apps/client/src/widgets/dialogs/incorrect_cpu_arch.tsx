import { useRef } from "react";
import { closeActiveDialog, openDialog } from "../../services/dialog.js";
import { t } from "../../services/i18n.js";
import utils from "../../services/utils.js";
import Button from "../react/Button.js";
import Modal from "../react/Modal.js";
import ReactBasicWidget from "../react/ReactBasicWidget.js";

function IncorrectCpuArchDialogComponent() {
    const downloadButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <Modal
            className="cpu-arch-dialog"
            size="lg"
            title={t("cpu_arch_warning.title")}
            onShown={() => downloadButtonRef.current?.focus()}
            footerAlignment="between"
            footer={<>
                <Button
                    buttonRef={downloadButtonRef}
                    text={t("cpu_arch_warning.download_link")}
                    icon="bx bx-download"
                    onClick={() => {
                        // Open the releases page where users can download the correct version
                        if (utils.isElectron()) {
                            const { shell } = utils.dynamicRequire("electron");
                            shell.openExternal("https://github.com/TriliumNext/Trilium/releases/latest");
                        } else {
                            window.open("https://github.com/TriliumNext/Trilium/releases/latest", "_blank");
                        }
                    }}/>
                <Button text={t("cpu_arch_warning.continue_anyway")}
                    onClick={() => closeActiveDialog()} />
            </>}
        >
            <p>{utils.isMac() ? t("cpu_arch_warning.message_macos") : t("cpu_arch_warning.message_windows")}</p>
            <p>{t("cpu_arch_warning.recommendation")}</p>
        </Modal>
    )
}

export default class IncorrectCpuArchDialog extends ReactBasicWidget {
 
    get component() {
        return <IncorrectCpuArchDialogComponent />
    }

    showCpuArchWarningEvent() {        
        openDialog(this.$widget);
    }

}
