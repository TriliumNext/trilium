import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons";
import utils from "../../../../services/utils.js";
import keyboardActionsService from "../../../../services/keyboard_actions.js";
import linkService from "../../../.././services/link.js";

const TPL = /*html*/`
<div class="options-section">
    <h4>${t("custom_date_time_format.title")}</h4>

    <p class="description use-tn-links">
        ${t("custom_date_time_format.description")}
    </p>

    <div class="form-group row align-items-center">
        <div class="col-6">
            <label for="custom-date-time-format">${t("custom_date_time_format.format_string")}</label>
            <input type="text" id="custom-date-time-format" class="form-control custom-date-time-format" placeholder="YYYY-MM-DD HH:mm">
        </div>
        <div class="col-6">
            <label>${t("custom_date_time_format.formatted_time")}</label>
            <div class="formatted-date"></div>
        </div>
    </div>
</div>
`;

export default class DateTimeFormatOptions extends OptionsWidget {

    private $formatInput!: JQuery<HTMLInputElement>;
    private $formattedDate!: JQuery<HTMLInputElement>;

    doRender() {
        this.$widget = $(TPL);

        this.$formatInput = this.$widget.find("input.custom-date-time-format");
        this.$formattedDate = this.$widget.find(".formatted-date");

        this.$formatInput.on("input", () => {
            const dateString = utils.formatDateTime(new Date(), this.$formatInput.val());
            this.$formattedDate.text(dateString);
        });

        this.$formatInput.on('blur keydown', (e) => {
            if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
                this.updateOption("customDateTimeFormat", this.$formatInput.val());
            }
        });

        return this.$widget;
    }

    async optionsLoaded(options: OptionMap) {
        const shortcutKey = (await keyboardActionsService.getAction("insertDateTimeToText")).effectiveShortcuts.join(", ");
        const $link = await linkService.createLink("_hidden/_options/_optionsShortcuts", {
            "title": shortcutKey,
            "showTooltip": false
        });
        this.$widget.find(".description").find("kbd").replaceWith($link);

        const customDateTimeFormat = options.customDateTimeFormat || "YYYY-MM-DD HH:mm";
        this.$formatInput.val(customDateTimeFormat);
        const dateString = utils.formatDateTime(new Date(), customDateTimeFormat);
        this.$formattedDate.text(dateString);
    }
}
