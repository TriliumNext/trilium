import { t } from "../../services/i18n.js";
import OnClickButtonWidget from "./onclick_button.js";

export default class CreatePaneButton extends OnClickButtonWidget {
    constructor() {
        super();

        this.icon("bx-dock-right")
            .title(t("create_pane_button.create_new_split"))
            .titlePlacement("bottom")
            .onClick((widget, e) => {
                widget.triggerCommand("openNewNoteSplit", { ntxId: widget.getClosestNtxId() });
                e.stopPropagation();
            })
            .class("icon-action");
    }
}
