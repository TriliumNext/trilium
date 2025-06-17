import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import utils from "../../../../services/utils.js";
import { getAvailableLocales, t } from "../../../../services/i18n.js";
import type { OptionMap, Locale } from "@triliumnext/commons";

const TPL = /*html*/`
<div class="options-section">
    <h4>${t("i18n.title")}</h4>

    <div class="locale-options-container">
        <div class="option-row">
            <label for="locale-select">${t("i18n.language")}</label>
            <select id="locale-select" class="locale-select form-select"></select>
        </div>

        <div class="option-row electron-only">
            <label for="formatting-locale-select">${t("i18n.formatting-locale")}</label>
            <select id="formatting-locale-select" class="formatting-locale-select form-select"></select>
        </div>

        <div class="option-row">
            <label id="first-day-of-week-label">${t("i18n.first-day-of-the-week")}</label>
            <div role="group" aria-labelledby="first-day-of-week-label">
                <label class="tn-radio">
                    <input name="first-day-of-week" type="radio" value="0" />
                    ${t("i18n.sunday")}
                </label>

                <label class="tn-radio">
                    <input name="first-day-of-week" type="radio" value="1" />
                    ${t("i18n.monday")}
                </label>
            </div>
        </div>

        <div class="option-row">
            <label id="first-week-of-year-label">${t("i18n.first-week-of-the-year")}</label>
            <div role="group" aria-labelledby="first-week-of-year-label">
                <label class="tn-radio">
                    <input name="first-week-of-year" type="radio" value="0" />
                    ${t("i18n.first-week-contains-first-day")}
                </label>

                <label class="tn-radio">
                    <input name="first-week-of-year" type="radio" value="1" />
                    ${t("i18n.first-week-contains-first-thursday")}
                </label>

                <label class="tn-radio">
                    <input name="first-week-of-year" type="radio" value="2" />
                    ${t("i18n.first-week-has-minimum-days")}
                </label>
            </div>
        </div>

        <div class="option-row min-days-row" style="display: none;">
            <label for="min-days-in-first-week">${t("i18n.min-days-in-first-week")}</label>
            <select id="min-days-in-first-week" class="form-select">
                ${Array.from({ length: 7 }, (_, i) => i + 1)
        .map(num => `<option value="${num}">${num}</option>`)
        .join('')}
            </select>
        </div>

        <p class="form-text use-tn-links">${t("i18n.first-week-info")}</p>

        <div class="admonition warning" role="alert">
            ${t("i18n.first-week-warning")}
        </div>

        <div class="option-row centered">
            <button class="btn btn-secondary btn-micro restart-app-button">${t("electron_integration.restart-app-button")}</button>
        </div>
    </div>

    <style>
        .locale-options-container .option-row {
            border-bottom: 1px solid var(--main-border-color);
            display: flex;
            align-items: center;
            padding: 0.5em 0;
        }

        .locale-options-container .option-row > label {
            width: 40%;
            margin-bottom: 0 !important;
        }

        .locale-options-container .option-row > select {
            width: 60%;
        }

        .locale-options-container .option-row:last-of-type {
            border-bottom: unset;
        }

        .locale-options-container .option-row.centered {
            justify-content: center;
        }

        .locale-options-container .option-row [aria-labelledby="first-week-of-year-label"] {
            display: flex;
            flex-direction: column;
        }

        .locale-options-container .option-row [aria-labelledby="first-week-of-year-label"] .tn-radio {
            margin-left: 0;
            white-space: nowrap;
        }
    </style>
</div>
`;

export default class LocalizationOptions extends OptionsWidget {

    private $localeSelect!: JQuery<HTMLElement>;
    private $formattingLocaleSelect!: JQuery<HTMLElement>;
    private $minDaysRow!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        this.$minDaysRow = this.$widget.find(".min-days-row");

        this.$localeSelect = this.$widget.find(".locale-select");
        this.$localeSelect.on("change", async () => {
            const newLocale = this.$localeSelect.val();
            await server.put(`options/locale/${newLocale}`);
        });

        this.$formattingLocaleSelect = this.$widget.find(".formatting-locale-select");
        this.$formattingLocaleSelect.on("change", async () => {
            const newLocale = this.$formattingLocaleSelect.val();
            await server.put(`options/formattingLocale/${newLocale}`);
        });

        this.$widget.find(`input[name="first-day-of-week"]`).on("change", () => {
            const firstDayOfWeek = String(this.$widget.find(`input[name="first-day-of-week"]:checked`).val());
            this.updateOption("firstDayOfWeek", firstDayOfWeek);
        });

        this.$widget.find('input[name="first-week-of-year"]').on('change', (e) => {
            const target = e.target as HTMLInputElement;
            const value = parseInt(target.value);

            if (value === 2) {
                this.$minDaysRow.show();
            } else {
                this.$minDaysRow.hide();
            }

            this.updateOption("firstWeekOfYear", value);
        });

        const currentValue = this.$widget.find('input[name="first-week-of-year"]:checked').val();
        if (currentValue === 2) {
            this.$minDaysRow.show();
        }

        this.$widget.find("#min-days-in-first-week").on("change", () => {
            const minDays = this.$widget.find("#min-days-in-first-week").val();
            this.updateOption("minDaysInFirstWeek", minDays);
        });

        this.$widget.find(".restart-app-button").on("click", utils.restartDesktopApp);
    }

    async optionsLoaded(options: OptionMap) {
        const allLocales = getAvailableLocales();

        function buildLocaleItem(locale: Locale, value: string) {
            return $("<option>")
                .attr("value", value)
                .text(locale.name)
        }

        // Build list of UI locales.
        this.$localeSelect.empty();
        for (const locale of allLocales.filter(l => !l.contentOnly)) {
            this.$localeSelect.append(buildLocaleItem(locale, locale.id));
        }
        this.$localeSelect.val(options.locale);

        // Build list of Electron locales.
        this.$formattingLocaleSelect.empty();
        for (const locale of allLocales.filter(l => l.electronLocale)) {
            this.$formattingLocaleSelect.append(buildLocaleItem(locale, locale.electronLocale as string));
        }
        this.$formattingLocaleSelect.val(options.formattingLocale);

        this.$widget.find(`input[name="first-day-of-week"][value="${options.firstDayOfWeek}"]`)
            .prop("checked", "true");

        this.$widget.find(`input[name="first-week-of-year"][value="${options.firstWeekOfYear}"]`)
            .prop("checked", "true");

        if (parseInt(options.firstWeekOfYear) === 2) {
            this.$minDaysRow.show();
        }

        this.$widget.find("#min-days-in-first-week").val(options.minDaysInFirstWeek);
    }
}
