import options from "../../services/options.js";
import splitService from "../../services/resizer.js";
import CommandButtonWidget from "./command_button.js";
import { t } from "../../services/i18n.js";
import type { EventData } from "../../components/app_context.js";

export default class LeftPaneToggleWidget extends CommandButtonWidget {
    private currentLeftPaneVisible: boolean;

    constructor(isHorizontalLayout: boolean) {
        super();

        this.currentLeftPaneVisible = options.is("leftPaneVisible");

        this.class(isHorizontalLayout ? "toggle-button" : "launcher-button");

        this.settings.icon = () => {
            if (options.get("layoutOrientation") === "horizontal") {
                return "bx-sidebar";
            }

            return this.currentLeftPaneVisible ? "bx-chevrons-left" : "bx-chevrons-right";
        };

        this.settings.title = () => (this.currentLeftPaneVisible ? t("left_pane_toggle.hide_panel") : t("left_pane_toggle.show_panel"));

        this.settings.command = () => (this.currentLeftPaneVisible ? "hideLeftPane" : "showLeftPane");

        if (isHorizontalLayout) {
            this.settings.titlePlacement = "bottom";
        }
    }

    refreshIcon() {
        super.refreshIcon();
        splitService.setupLeftPaneResizer(this.currentLeftPaneVisible);
    }
    
    setLeftPaneVisibilityEvent({ leftPaneVisible }: EventData<"setLeftPaneVisibility">) {
        this.currentLeftPaneVisible = leftPaneVisible ?? !this.currentLeftPaneVisible;
        this.refreshIcon();
    }
}
