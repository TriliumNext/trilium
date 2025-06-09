import OnClickButtonWidget from "../buttons/onclick_button.js";
import appContext from "../../components/app_context.js";
import attributeService from "../../services/attributes.js";
import protectedSessionHolder from "../../services/protected_session_holder.js";
import { t } from "../../services/i18n.js";
import LoadResults from "../../services/load_results.js";
import type { AttributeRow } from "../../services/load_results.js";
import FNote from "../../entities/fnote.js";
import options from "../../services/options.js";

export default class EditButton extends OnClickButtonWidget {
    isEnabled(): boolean {
        return Boolean(super.isEnabled() && this.note && this.noteContext?.viewScope?.viewMode === "default");
    }

    constructor() {
        super();

        this.icon("bx-pencil")
            .title(t("edit_button.edit_this_note"))
            .titlePlacement("bottom")
            .onClick((widget) => {
                if (this.noteContext?.viewScope) {
                    this.noteContext.viewScope.readOnlyTemporarilyDisabled = true;
                    appContext.triggerEvent("readOnlyTemporarilyDisabled", { noteContext: this.noteContext });
                }
            });
    }

    async refreshWithNote(note: FNote): Promise<void> {
        if (options.is("databaseReadonly")) {
            this.toggleInt(false);
            return;
        }
        if (note.isProtected && !protectedSessionHolder.isProtectedSessionAvailable()) {
            this.toggleInt(false);
        } else {
            // prevent flickering by assuming hidden before async operation
            this.toggleInt(false);

            const wasVisible = this.isVisible();

            // can't do this in isEnabled() since isReadOnly is async
            const isReadOnly = await this.noteContext?.isReadOnly();
            this.toggleInt(Boolean(isReadOnly));

            // make the edit button stand out on the first display, otherwise
            // it's difficult to notice that the note is readonly
            if (this.isVisible() && !wasVisible && this.$widget) {
                this.$widget.addClass("bx-tada bx-lg");

                setTimeout(() => {
                    this.$widget?.removeClass("bx-tada bx-lg");
                }, 1700);
            }
        }

        await super.refreshWithNote(note);
    }

    entitiesReloadedEvent({ loadResults }: { loadResults: LoadResults }): void {
        if (loadResults.getAttributeRows().find((attr: AttributeRow) =>
            attr.type === "label" &&
            attr.name?.toLowerCase().includes("readonly") &&
            this.note &&
            attributeService.isAffecting(attr, this.note)
        )) {
            if (this.noteContext?.viewScope) {
                this.noteContext.viewScope.readOnlyTemporarilyDisabled = false;
            }
            this.refresh();
        }
    }

    readOnlyTemporarilyDisabledEvent() {
        this.refresh();
    }

    async noteTypeMimeChangedEvent({ noteId }: { noteId: string }): Promise<void> {
        if (this.isNote(noteId)) {
            await this.refresh();
        }
    }
}
