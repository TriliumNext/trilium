import BasicWidget from "../basic_widget.js";
import { Modal } from "bootstrap";
import utils from "../../services/utils.js";
import { t } from "../../services/i18n.js";

const TPL = /*html*/`
<div class="cpu-arch-dialog modal mx-auto" tabindex="-1" role="dialog" style="z-index: 2000;">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">${t("cpu_arch_warning.title")}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>${utils.isMac() ? t("cpu_arch_warning.message_macos") : t("cpu_arch_warning.message_windows")}</p>

                <p>${t("cpu_arch_warning.recommendation")}</p>
            </div>
            <div class="modal-footer d-flex justify-content-between align-items-center">
                <button class="download-correct-version-button btn btn-primary btn-lg me-2">
                    <span class="bx bx-download"></span>
                    ${t("cpu_arch_warning.download_link")}
                </button>

                <button class="btn btn-secondary" data-bs-dismiss="modal">${t("cpu_arch_warning.continue_anyway")}</button>
            </div>
        </div>
    </div>
</div>`;

export default class IncorrectCpuArchDialog extends BasicWidget {
    private modal!: Modal;
    private $downloadButton!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.modal = Modal.getOrCreateInstance(this.$widget[0]);
        this.$downloadButton = this.$widget.find(".download-correct-version-button");

        this.$downloadButton.on("click", () => {
            // Open the releases page where users can download the correct version
            if (utils.isElectron()) {
                const { shell } = utils.dynamicRequire("electron");
                shell.openExternal("https://github.com/TriliumNext/Notes/releases/latest");
            } else {
                window.open("https://github.com/TriliumNext/Notes/releases/latest", "_blank");
            }
        });

        // Auto-focus the download button when shown
        this.$widget.on("shown.bs.modal", () => {
            this.$downloadButton.trigger("focus");
        });
    }

    showCpuArchWarningEvent() {
        this.modal.show();
    }
}
