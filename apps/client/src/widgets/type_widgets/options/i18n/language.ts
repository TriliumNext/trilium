import OptionsWidget from "../options_widget.js";
import type { OptionMap } from "@triliumnext/commons";
import { getAvailableLocales } from "../../../../services/i18n.js";
import { t } from "../../../../services/i18n.js";

const TPL = /*html*/`
<div class="options-section">
    <h4>${t("content_language.title")}</h4>
    <p class="form-text">${t("content_language.description")}</p>

    <ul class="options-languages">
    </ul>

    <style>
        ul.options-languages {
            list-style-type: none;
            margin-bottom: 0;
            column-width: 400px;
        }
    </style>
</div>
`;

export default class LanguageOptions extends OptionsWidget {

    private $languagesContainer!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$languagesContainer = this.$widget.find(".options-languages");
    }

    async save() {
        const enabledLanguages: string[] = [];

        this.$languagesContainer.find("input:checked").each((i, el) => {
            const languageId = $(el).attr("data-language-id");
            if (languageId) {
                enabledLanguages.push(languageId);
            }
        });

        await this.updateOption("languages", JSON.stringify(enabledLanguages));
    }

    async optionsLoaded(options: OptionMap) {
        const availableLocales = getAvailableLocales();
        const enabledLanguages = (JSON.parse(options.languages) as string[]);

        this.$languagesContainer.empty();
        for (const locale of availableLocales) {
            const checkbox = $('<input type="checkbox" class="form-check-input">')
                .attr("data-language-id", locale.id)
                .prop("checked", enabledLanguages.includes(locale.id));
            const wrapper = $(`<label class="tn-checkbox">`)
                .append(checkbox)
                .on("change", () => this.save())
                .append(locale.name);
            this.$languagesContainer.append($("<li>").append(wrapper));
        }
    }

}
