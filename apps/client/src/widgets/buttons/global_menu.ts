import { t } from "../../services/i18n.js";
import BasicWidget from "../basic_widget.js";
import utils from "../../services/utils.js";
import UpdateAvailableWidget from "./update_available.js";
import options from "../../services/options.js";
import { Tooltip, Dropdown } from "bootstrap";

const TPL = /*html*/`
<div class="dropdown global-menu">
    <style>
    .global-menu {
        width: 53px;
        height: 53px;
        flex-shrink: 0;
    }

    .global-menu .dropdown-menu {
        min-width: 20em;
    }

    .global-menu-button {
        width: 100%;
        height: 100%;
        position: relative;
        padding: 6px;
        border: 0;
    }

    .global-menu-button > svg path {
        fill: var(--launcher-pane-text-color);
    }

    .global-menu-button:hover { border: 0; }
    .global-menu-button:hover > svg path {
        transition: 200ms ease-in-out fill;
    }
    .global-menu-button:hover > svg path.st0 { fill:#95C980; }
    .global-menu-button:hover > svg path.st1 { fill:#72B755; }
    .global-menu-button:hover > svg path.st2 { fill:#4FA52B; }
    .global-menu-button:hover > svg path.st3 { fill:#EE8C89; }
    .global-menu-button:hover > svg path.st4 { fill:#E96562; }
    .global-menu-button:hover > svg path.st5 { fill:#E33F3B; }
    .global-menu-button:hover > svg path.st6 { fill:#EFB075; }
    .global-menu-button:hover > svg path.st7 { fill:#E99547; }
    .global-menu-button:hover > svg path.st8 { fill:#E47B19; }

    .global-menu-button-update-available {
        position: absolute;
        right: -30px;
        bottom: -30px;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .global-menu .zoom-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
    }

    .global-menu .zoom-buttons a {
        display: inline-block;
        border: 1px solid var(--button-border-color);
        border-radius: var(--button-border-radius);
        color: var(--button-text-color);
        background-color: var(--button-background-color);
        padding: 3px;
        margin-left: 3px;
        text-decoration: none;
    }

    .global-menu .zoom-buttons a:hover {
        text-decoration: none;
    }

    .global-menu .zoom-state {
        margin-left: 5px;
        margin-right: 5px;
    }

    .global-menu .dropdown-item .bx {
        position: relative;
        top: 3px;
        font-size: 120%;
        margin-right: 6px;
    }
    </style>

    <button type="button" data-bs-toggle="dropdown" aria-haspopup="true"
            aria-expanded="false" class="icon-action global-menu-button">
        <div class="global-menu-button-update-available"></div>
    </button>

    <ul class="dropdown-menu dropdown-menu-right">
        <li class="dropdown-item" data-trigger-command="openNewWindow">
            <span class="bx bx-window-open"></span>
            ${t("global_menu.open_new_window")}
            <kbd data-command="openNewWindow"></kbd>
        </li>

        <li class="dropdown-item" data-trigger-command="showShareSubtree">
            <span class="bx bx-share-alt"></span>
            ${t("global_menu.show_shared_notes_subtree")}
        </li>

        <div class="dropdown-divider"></div>

        <span class="zoom-container dropdown-item dropdown-item-container">
            <div>
                <span class="bx bx-empty"></span>
                ${t("global_menu.zoom")}
            </div>

            <div class="zoom-buttons">
                <a data-trigger-command="toggleFullscreen" title="${t("global_menu.toggle_fullscreen")}" class="bx bx-expand-alt"></a>

                &nbsp;

                <a data-trigger-command="zoomOut" title="${t("global_menu.zoom_out")}" class="bx bx-minus"></a>

                <span data-trigger-command="zoomReset" title="${t("global_menu.reset_zoom_level")}" class="zoom-state"></span>

                <a data-trigger-command="zoomIn" title="${t("global_menu.zoom_in")}" class="bx bx-plus"></a>
            </div>
        </span>

        <li class="dropdown-item toggle-pin">
            <span class="bx bx-pin"></span>
            ${t("title_bar_buttons.window-on-top")}
        </li>

        <li class="dropdown-item" data-trigger-command="toggleZenMode">
            <span class="bx bxs-yin-yang"></span>
            ${t("global_menu.toggle-zen-mode")}
            <kbd data-command="toggleZenMode"></kbd>
        </li>

        <div class="dropdown-divider desktop-only"></div>

        <li class="dropdown-item switch-to-mobile-version-button" data-trigger-command="switchToMobileVersion">
            <span class="bx bx-mobile"></span>
            ${t("global_menu.switch_to_mobile_version")}
        </li>

        <li class="dropdown-item switch-to-desktop-version-button" data-trigger-command="switchToDesktopVersion">
            <span class="bx bx-desktop"></span>
            ${t("global_menu.switch_to_desktop_version")}
        </li>

        <li class="dropdown-item" data-trigger-command="showLaunchBarSubtree">
            <span class="bx ${utils.isMobile() ? "bx-mobile" : "bx-sidebar"}"></span>
            ${t("global_menu.configure_launchbar")}
        </li>

        <li class="dropdown-item dropdown-submenu">
            <span class="dropdown-toggle">
                <span class="bx bx-chip"></span>${t("global_menu.advanced")}
            </span>

            <ul class="dropdown-menu">
                <li class="dropdown-item" data-trigger-command="showHiddenSubtree">
                    <span class="bx bx-hide"></span>
                    ${t("global_menu.show_hidden_subtree")}
                </li>

                <li class="dropdown-item" data-trigger-command="showSearchHistory">
                    <span class="bx bx-search-alt"></span>
                    ${t("global_menu.open_search_history")}
                </li>

                <div class="dropdown-divider"></div>

                <li class="dropdown-item" data-trigger-command="showBackendLog">
                    <span class="bx bx-detail"></span>
                    ${t("global_menu.show_backend_log")}
                    <kbd data-command="showBackendLog"></kbd>
                </li>

                <li class="dropdown-item" data-trigger-command="showSQLConsole">
                    <span class="bx bx-data"></span>
                    ${t("global_menu.open_sql_console")}
                    <kbd data-command="showSQLConsole"></kbd>
                </li>

                <li class="dropdown-item" data-trigger-command="showSQLConsoleHistory">
                    <span class="bx bx-data"></span>
                    ${t("global_menu.open_sql_console_history")}
                </li>

                <div class="dropdown-divider"></div>

                <li class="dropdown-item open-dev-tools-button" data-trigger-command="openDevTools">
                    <span class="bx bx-bug-alt"></span>
                    ${t("global_menu.open_dev_tools")}
                    <kbd data-command="openDevTools"></kbd>
                </li>

                <li class="dropdown-item" data-trigger-command="reloadFrontendApp"
                    title="${t("global_menu.reload_hint")}">
                    <span class="bx bx-refresh"></span>
                    ${t("global_menu.reload_frontend")}
                    <kbd data-command="reloadFrontendApp"></kbd>
                </li>

            </ul>
        </li>

        <li class="dropdown-item" data-trigger-command="showOptions">
            <span class="bx bx-cog"></span>
            ${t("global_menu.options")}
        </li>

        <div class="dropdown-divider desktop-only"></div>

        <li class="dropdown-item show-help-button" data-trigger-command="showHelp">
            <span class="bx bx-help-circle"></span>
            ${t("global_menu.show_help")}
            <kbd data-command="showHelp"></kbd>
        </li>

        <li class="dropdown-item show-help-button" data-trigger-command="showCheatsheet">
            <span class="bx bxs-keyboard"></span>
            ${t("global_menu.show-cheatsheet")}
            <kbd data-command="showCheatsheet"></kbd>
        </li>

        <li class="dropdown-item show-about-dialog-button">
            <span class="bx bx-info-circle"></span>
            ${t("global_menu.about")}
        </li>

        <li class="dropdown-item update-to-latest-version-button" style="display: none;" data-trigger-command="downloadLatestVersion">
            <span class="bx bx-sync"></span>

            <span class="version-text"></span>
        </li>

        <div class="dropdown-divider logout-button-separator"></div>

        <li class="dropdown-item logout-button" data-trigger-command="logout">
            <span class="bx bx-log-out"></span>
            ${t("global_menu.logout")}
        </li>
    </ul>
</div>
`;

export default class GlobalMenuWidget extends BasicWidget {
    private updateAvailableWidget: UpdateAvailableWidget;
    private isHorizontalLayout: boolean;
    private tooltip!: Tooltip;
    private dropdown!: Dropdown;

    private $updateToLatestVersionButton!: JQuery<HTMLElement>;
    private $zoomState!: JQuery<HTMLElement>;
    private $toggleZenMode!: JQuery<HTMLElement>;

    constructor(isHorizontalLayout: boolean) {
        super();

        this.updateAvailableWidget = new UpdateAvailableWidget();
        this.isHorizontalLayout = isHorizontalLayout;
    }

    doRender() {
        this.$widget = $(TPL);

        if (!this.isHorizontalLayout) {
            this.$widget.addClass("dropend");
        }

        const $globalMenuButton = this.$widget.find(".global-menu-button");
        if (!this.isHorizontalLayout) {
            $globalMenuButton.prepend(
                $(`\
                <svg viewBox="0 0 256 256" data-bs-toggle="tooltip" title="${t("global_menu.menu")}">
                    <g>
                        <path class="st0" d="m202.9 112.7c-22.5 16.1-54.5 12.8-74.9 6.3l14.8-11.8 14.1-11.3 49.1-39.3-51.2 35.9-14.3 10-14.9 10.5c0.7-21.2 7-49.9 28.6-65.4 1.8-1.3 3.9-2.6 6.1-3.8 2.7-1.5 5.7-2.9 8.8-4.1 27.1-11.1 68.5-15.3 85.2-9.5 0.1 16.2-15.9 45.4-33.9 65.9-2.4 2.8-4.9 5.4-7.4 7.8-3.4 3.5-6.8 6.4-10.1 8.8z"/>
                        <path class="st1" d="m213.1 104c-22.2 12.6-51.4 9.3-70.3 3.2l14.1-11.3 49.1-39.3-51.2 35.9-14.3 10c0.5-18.1 4.9-42.1 19.7-58.6 2.7-1.5 5.7-2.9 8.8-4.1 27.1-11.1 68.5-15.3 85.2-9.5 0.1 16.2-15.9 45.4-33.9 65.9-2.3 2.8-4.8 5.4-7.2 7.8z"/>
                        <path class="st2" d="m220.5 96.2c-21.1 8.6-46.6 5.3-63.7-0.2l49.2-39.4-51.2 35.9c0.3-15.8 3.5-36.6 14.3-52.8 27.1-11.1 68.5-15.3 85.2-9.5 0.1 16.2-15.9 45.4-33.8 66z"/>

                        <path class="st3" d="m106.7 179c-5.8-21 5.2-43.8 15.5-57.2l4.8 14.2 4.5 13.4 15.9 47-12.8-47.6-3.6-13.2-3.7-13.9c15.5 6.2 35.1 18.6 40.7 38.8 0.5 1.7 0.9 3.6 1.2 5.5 0.4 2.4 0.6 5 0.7 7.7 0.9 23.1-7.1 54.9-15.9 65.7-12-4.3-29.3-24-39.7-42.8-1.4-2.6-2.7-5.1-3.8-7.6-1.6-3.5-2.9-6.8-3.8-10z"/>
                        <path class="st4" d="m110.4 188.9c-3.4-19.8 6.9-40.5 16.6-52.9l4.5 13.4 15.9 47-12.8-47.6-3.6-13.2c13.3 5.2 29.9 15 38.1 30.4 0.4 2.4 0.6 5 0.7 7.7 0.9 23.1-7.1 54.9-15.9 65.7-12-4.3-29.3-24-39.7-42.8-1.4-2.6-2.7-5.2-3.8-7.7z"/>
                        <path class="st5" d="m114.2 196.5c-0.7-18 8.6-35.9 17.3-47.1l15.9 47-12.8-47.6c11.6 4.4 26.1 12.4 35.2 24.8 0.9 23.1-7.1 54.9-15.9 65.7-12-4.3-29.3-24-39.7-42.8z"/>

                        <path class="st6" d="m86.3 59.1c21.7 10.9 32.4 36.6 35.8 54.9l-15.2-6.6-14.5-6.3-50.6-22 48.8 24.9 13.6 6.9 14.3 7.3c-16.6 7.9-41.3 14.5-62.1 4.1-1.8-0.9-3.6-1.9-5.4-3.2-2.3-1.5-4.5-3.2-6.8-5.1-19.9-16.4-40.3-46.4-42.7-61.5 12.4-6.5 41.5-5.8 64.8-0.3 3.2 0.8 6.2 1.6 9.1 2.5 4 1.3 7.6 2.8 10.9 4.4z"/>
                        <path class="st7" d="m75.4 54.8c18.9 12 28.4 35.6 31.6 52.6l-14.5-6.3-50.6-22 48.7 24.9 13.6 6.9c-14.1 6.8-34.5 13-53.3 8.2-2.3-1.5-4.5-3.2-6.8-5.1-19.8-16.4-40.2-46.4-42.6-61.5 12.4-6.5 41.5-5.8 64.8-0.3 3.1 0.8 6.2 1.6 9.1 2.6z"/>
                        <path class="st8" d="m66.3 52.2c15.3 12.8 23.3 33.6 26.1 48.9l-50.6-22 48.8 24.9c-12.2 6-29.6 11.8-46.5 10-19.8-16.4-40.2-46.4-42.6-61.5 12.4-6.5 41.5-5.8 64.8-0.3z"/>
                    </g>
                </svg>`)
            );

            this.tooltip = new Tooltip(this.$widget.find("[data-bs-toggle='tooltip']")[0], { trigger: "hover" });
        } else {
            $globalMenuButton.toggleClass("bx bx-menu");
        }

        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0], {
            popperConfig: {
                placement: "bottom"
            }
        });

        this.$widget.find(".show-about-dialog-button").on("click", () => this.triggerCommand("openAboutDialog"));

        const isElectron = utils.isElectron();

        this.$widget.find(".toggle-pin").toggle(isElectron);
        if (isElectron) {
            this.$widget.on("click", ".toggle-pin", (e) => {
                const $el = $(e.target);
                const remote = utils.dynamicRequire("@electron/remote");
                const focusedWindow = remote.BrowserWindow.getFocusedWindow();
                const isAlwaysOnTop = focusedWindow.isAlwaysOnTop();
                if (isAlwaysOnTop) {
                    focusedWindow.setAlwaysOnTop(false);
                    $el.removeClass("active");
                } else {
                    focusedWindow.setAlwaysOnTop(true);
                    $el.addClass("active");
                }
            });
        }

        this.$widget.find(".logout-button").toggle(!isElectron);
        this.$widget.find(".logout-button-separator").toggle(!isElectron);

        this.$widget.find(".open-dev-tools-button").toggle(isElectron);
        this.$widget.find(".switch-to-mobile-version-button").toggle(!isElectron && utils.isDesktop());
        this.$widget.find(".switch-to-desktop-version-button").toggle(!isElectron && utils.isMobile());

        this.$widget.on("click", ".dropdown-item", (e) => {
            if ($(e.target).parent(".zoom-buttons")) {
                return;
            }

            this.dropdown.toggle();
        });
        if (utils.isMobile()) {
            this.$widget.on("click", ".dropdown-submenu .dropdown-toggle", (e) => {
                const $submenu = $(e.target).closest(".dropdown-item");
                $submenu.toggleClass("submenu-open");
                $submenu.find("ul.dropdown-menu").toggleClass("show");
                e.stopPropagation();
                return;
            });
        }
        this.$widget.on("click", ".dropdown-submenu", (e) => {
            if ($(e.target).children(".dropdown-menu").length === 1 || $(e.target).hasClass("dropdown-toggle")) {
                e.stopPropagation();
            }
        });

        this.$widget.find(".global-menu-button-update-available").append(this.updateAvailableWidget.render());

        this.$updateToLatestVersionButton = this.$widget.find(".update-to-latest-version-button");

        if (!utils.isElectron()) {
            this.$widget.find(".zoom-container").hide();
        }

        this.$zoomState = this.$widget.find(".zoom-state");
        this.$toggleZenMode = this.$widget.find('[data-trigger-command="toggleZenMode"');
        this.$toggleZenMode.toggle(!utils.isMobile());
        this.$widget.on("show.bs.dropdown", () => this.#onShown());
        if (this.tooltip) {
            this.$widget.on("hide.bs.dropdown", () => this.tooltip.enable());
        }

        this.$widget.find(".zoom-buttons").on(
            "click",
            // delay to wait for the actual zoom change
            () => setTimeout(() => this.updateZoomState(), 300)
        );

        this.updateVersionStatus();

        setInterval(() => this.updateVersionStatus(), 8 * 60 * 60 * 1000);
    }

    #onShown() {
        this.$toggleZenMode.toggleClass("active", $("body").hasClass("zen"));
        this.updateZoomState();
        if (this.tooltip) {
            this.tooltip.hide();
            this.tooltip.disable();
        }
    }

    updateZoomState() {
        if (!utils.isElectron()) {
            return;
        }

        const zoomFactor = utils.dynamicRequire("electron").webFrame.getZoomFactor();
        const zoomPercent = Math.round(zoomFactor * 100);

        this.$zoomState.text(`${zoomPercent}%`);
    }

    async updateVersionStatus() {
        await options.initializedPromise;

        if (options.get("checkForUpdates") !== "true") {
            return;
        }

        const latestVersion = await this.fetchLatestVersion();
        this.updateAvailableWidget.updateVersionStatus(latestVersion);
        // Show "click to download" button in options menu if there's a new version available
        this.$updateToLatestVersionButton.toggle(utils.isUpdateAvailable(latestVersion, glob.triliumVersion));
        this.$updateToLatestVersionButton.find(".version-text").text(`Version ${latestVersion} is available, click to download.`);
    }

    async fetchLatestVersion() {
        const RELEASES_API_URL = "https://api.github.com/repos/TriliumNext/Notes/releases/latest";

        const resp = await fetch(RELEASES_API_URL);
        const data = await resp.json();

        return data?.tag_name?.substring(1);
    }

    downloadLatestVersionCommand() {
        window.open("https://github.com/TriliumNext/Notes/releases/latest");
    }

    activeContextChangedEvent() {
        this.dropdown.hide();
    }

    noteSwitchedEvent() {
        this.dropdown.hide();
    }
}
