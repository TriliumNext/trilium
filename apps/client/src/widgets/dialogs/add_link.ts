import { t } from "../../services/i18n.js";
import treeService from "../../services/tree.js";
import noteAutocompleteService from "../../services/note_autocomplete.js";
import utils from "../../services/utils.js";
import BasicWidget from "../basic_widget.js";
import type { Suggestion } from "../../services/note_autocomplete.js";
import type { default as TextTypeWidget } from "../type_widgets/editable_text.js";
import type { EventData } from "../../components/app_context.js";

const TPL = /*html*/`
<div class="add-link-dialog modal mx-auto" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" style="max-width: 1000px" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title flex-grow-1">${t("add_link.add_link")}</h5>
                <button type="button" class="help-button" title="${t("add_link.help_on_links")}" data-help-page="links.html">?</button>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${t("add_link.close")}"></button>
            </div>
            <form class="add-link-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="add-link-note-autocomplete">${t("add_link.note")}</label>

                        <div class="input-group">
                            <input class="add-link-note-autocomplete form-control" placeholder="${t("add_link.search_note")}">
                        </div>
                    </div>

                    <div class="add-link-title-settings">
                        <div class="add-link-title-radios form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="link-type" value="reference-link" checked>
                                ${t("add_link.link_title_mirrors")}
                            </label>
                        </div>
                        <div class="add-link-title-radios form-check">
                            <label class="form-check-label">
                                <input class="form-check-input" type="radio" name="link-type" value="hyper-link">
                                ${t("add_link.link_title_arbitrary")}
                            </label>
                        </div>

                        <div class="add-link-title-form-group form-group">
                            <br/>
                            <label>
                                ${t("add_link.link_title")}

                                <input class="link-title form-control" style="width: 100%;">
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">${t("add_link.button_add_link")}</button>
                </div>
            </form>
        </div>
    </div>
</div>`;

export default class AddLinkDialog extends BasicWidget {
    private $form!: JQuery<HTMLElement>;
    private $autoComplete!: JQuery<HTMLElement>;
    private $linkTitle!: JQuery<HTMLElement>;
    private $addLinkTitleSettings!: JQuery<HTMLElement>;
    private $addLinkTitleRadios!: JQuery<HTMLElement>;
    private $addLinkTitleFormGroup!: JQuery<HTMLElement>;
    private textTypeWidget: TextTypeWidget | null = null;

    doRender() {
        this.$widget = $(TPL);
        this.$form = this.$widget.find(".add-link-form");
        this.$autoComplete = this.$widget.find(".add-link-note-autocomplete");
        this.$linkTitle = this.$widget.find(".link-title");
        this.$addLinkTitleSettings = this.$widget.find(".add-link-title-settings");
        this.$addLinkTitleRadios = this.$widget.find(".add-link-title-radios");
        this.$addLinkTitleFormGroup = this.$widget.find(".add-link-title-form-group");

        this.$form.on("submit", () => {
            if (this.$autoComplete.getSelectedNotePath()) {
                this.$widget.modal("hide");

                const linkTitle = this.getLinkType() === "reference-link" ? null : this.$linkTitle.val() as string;

                this.textTypeWidget?.addLink(this.$autoComplete.getSelectedNotePath()!, linkTitle);
            } else if (this.$autoComplete.getSelectedExternalLink()) {
                this.$widget.modal("hide");

                this.textTypeWidget?.addLink(this.$autoComplete.getSelectedExternalLink()!, this.$linkTitle.val() as string, true);
            } else {
                logError("No link to add.");
            }

            return false;
        });
    }

    async showAddLinkDialogEvent({ textTypeWidget, text = "" }: EventData<"showAddLinkDialog">) {
        this.textTypeWidget = textTypeWidget;

        this.$addLinkTitleSettings.toggle(!this.textTypeWidget.hasSelection());

        this.$addLinkTitleSettings.find("input[type=radio]").on("change", () => this.updateTitleSettingsVisibility());

        // with selection hyperlink is implied
        if (this.textTypeWidget.hasSelection()) {
            this.$addLinkTitleSettings.find("input[value='hyper-link']").prop("checked", true);
        } else {
            this.$addLinkTitleSettings.find("input[value='reference-link']").prop("checked", true);
        }

        this.updateTitleSettingsVisibility();

        await utils.openDialog(this.$widget);

        this.$autoComplete.val("");
        this.$linkTitle.val("");

        const setDefaultLinkTitle = async (noteId: string) => {
            const noteTitle = await treeService.getNoteTitle(noteId);
            this.$linkTitle.val(noteTitle);
        };

        noteAutocompleteService.initNoteAutocomplete(this.$autoComplete, {
            allowExternalLinks: true,
            allowCreatingNotes: true
        });

        this.$autoComplete.on("autocomplete:noteselected", (event: JQuery.Event, suggestion: Suggestion) => {
            if (!suggestion.notePath) {
                return false;
            }

            this.updateTitleSettingsVisibility();

            const noteId = treeService.getNoteIdFromUrl(suggestion.notePath);

            if (noteId) {
                setDefaultLinkTitle(noteId);
            }
        });

        this.$autoComplete.on("autocomplete:externallinkselected", (event: JQuery.Event, suggestion: Suggestion) => {
            if (!suggestion.externalLink) {
                return false;
            }

            this.updateTitleSettingsVisibility();

            this.$linkTitle.val(suggestion.externalLink);
        });

        this.$autoComplete.on("autocomplete:cursorchanged", (event: JQuery.Event, suggestion: Suggestion) => {
            if (suggestion.externalLink) {
                this.$linkTitle.val(suggestion.externalLink);
            } else {
                const noteId = treeService.getNoteIdFromUrl(suggestion.notePath!);

                if (noteId) {
                    setDefaultLinkTitle(noteId);
                }
            }
        });

        if (text && text.trim()) {
            noteAutocompleteService.setText(this.$autoComplete, text);
        } else {
            noteAutocompleteService.showRecentNotes(this.$autoComplete);
        }

        this.$autoComplete.trigger("focus").trigger("select"); // to be able to quickly remove entered text
    }

    private getLinkType() {
        if (this.$autoComplete.getSelectedExternalLink()) {
            return "external-link";
        }

        return this.$addLinkTitleSettings.find("input[type=radio]:checked").val();
    }

    private updateTitleSettingsVisibility() {
        const linkType = this.getLinkType();

        this.$addLinkTitleFormGroup.toggle(linkType !== "reference-link");
        this.$addLinkTitleRadios.toggle(linkType !== "external-link");
    }
}
