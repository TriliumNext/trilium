import server from "../services/server.js";
import mimeTypesService from "../services/mime_types.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import dialogService from "../services/dialog.js";
import { t } from "../services/i18n.js";
import type FNote from "../entities/fnote.js";
import type { NoteType } from "../entities/fnote.js";
import type { EventData } from "../components/app_context.js";
import { Dropdown } from "bootstrap";

interface NoteTypeMapping {
    type: NoteType;
    mime?: string;
    title: string;
    isBeta?: boolean;
    selectable: boolean;
}

const NOTE_TYPES: NoteTypeMapping[] = [
    // The suggested note type ordering method: insert the item into the corresponding group,
    // then ensure the items within the group are ordered alphabetically.

    // The default note type (always the first item)
    { type: "text", mime: "text/html", title: t("note_types.text"), selectable: true },

    // Text notes group
    { type: "book", mime: "", title: t("note_types.book"), selectable: true },

    // Graphic notes
    { type: "canvas", mime: "application/json", title: t("note_types.canvas"), selectable: true },
    { type: "mermaid", mime: "text/mermaid", title: t("note_types.mermaid-diagram"), selectable: true },

    // Map notes
    { type: "geoMap", mime: "application/json", title: t("note_types.geo-map"), isBeta: true, selectable: true },
    { type: "mindMap", mime: "application/json", title: t("note_types.mind-map"), selectable: true },
    { type: "relationMap", mime: "application/json", title: t("note_types.relation-map"), selectable: true },

    // Misc note types
    { type: "render", mime: "", title: t("note_types.render-note"), selectable: true },
    { type: "webView", mime: "", title: t("note_types.web-view"), selectable: true },

    // Code notes
    { type: "code", mime: "text/plain", title: t("note_types.code"), selectable: true },

    // Reserved types (cannot be created by the user)
    { type: "contentWidget", mime: "", title: t("note_types.widget"), selectable: false },
    { type: "doc", mime: "", title: t("note_types.doc"), selectable: false },
    { type: "file", title: t("note_types.file"), selectable: false },
    { type: "image", title: t("note_types.image"), selectable: false },
    { type: "launcher", mime: "", title: t("note_types.launcher"), selectable: false },
    { type: "noteMap", mime: "", title: t("note_types.note-map"), selectable: false },
    { type: "search", title: t("note_types.saved-search"), selectable: false },
    { type: "aiChat", mime: "application/json", title: t("note_types.ai-chat"), selectable: false }
];

const NOT_SELECTABLE_NOTE_TYPES = NOTE_TYPES.filter((nt) => !nt.selectable).map((nt) => nt.type);

const TPL = /*html*/`
<div class="dropdown note-type-widget">
    <style>
        .note-type-dropdown {
            max-height: 500px;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .note-type-dropdown .badge {
            margin-left: 8px;
            background: var(--accented-background-color);
            font-weight: normal;
            color: var(--menu-text-color);
        }
    </style>
    <button type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-sm dropdown-toggle select-button note-type-button">
        <span class="note-type-desc"></span>
        <span class="caret"></span>
    </button>
    <div class="note-type-dropdown dropdown-menu dropdown-menu-left tn-dropdown-list"></div>
</div>
`;

export default class NoteTypeWidget extends NoteContextAwareWidget {

    private dropdown!: Dropdown;
    private $noteTypeDropdown!: JQuery<HTMLElement>;
    private $noteTypeButton!: JQuery<HTMLElement>;
    private $noteTypeDesc!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0]);

        this.$widget.on("show.bs.dropdown", () => this.renderDropdown());

        this.$noteTypeDropdown = this.$widget.find(".note-type-dropdown");
        this.$noteTypeButton = this.$widget.find(".note-type-button");
        this.$noteTypeDesc = this.$widget.find(".note-type-desc");

        this.$widget.on("click", ".dropdown-item", () => this.dropdown.toggle());
    }

    async refreshWithNote(note: FNote) {
        this.$noteTypeButton.prop("disabled", () => NOT_SELECTABLE_NOTE_TYPES.includes(note.type));

        this.$noteTypeDesc.text(await this.findTypeTitle(note.type, note.mime));

        this.dropdown.hide();
    }

    /** the actual body is rendered lazily on note-type button click */
    async renderDropdown() {
        this.$noteTypeDropdown.empty();

        if (!this.note) {
            return;
        }

        for (const noteType of NOTE_TYPES.filter((nt) => nt.selectable)) {
            let $typeLink: JQuery<HTMLElement>;

            const $title = $("<span>").text(noteType.title);
            if (noteType.isBeta) {
                $title.append($(`<span class="badge">`).text(t("note_types.beta-feature")));
            }

            if (noteType.type !== "code") {
                $typeLink = $('<a class="dropdown-item">')
                    .attr("data-note-type", noteType.type)
                    .append('<span class="check">&check;</span> ')
                    .append($title)
                    .on("click", (e) => {
                        const type = $typeLink.attr("data-note-type");
                        const noteType = NOTE_TYPES.find((nt) => nt.type === type);

                        if (noteType) {
                            this.save(noteType.type, noteType.mime);
                        }
                    });
            } else {
                this.$noteTypeDropdown.append('<div class="dropdown-divider"></div>');
                $typeLink = $('<a class="dropdown-item disabled">').attr("data-note-type", noteType.type).append('<span class="check">&check;</span> ').append($("<strong>").text(noteType.title));
            }

            if (this.note.type === noteType.type) {
                $typeLink.addClass("selected");
            }

            this.$noteTypeDropdown.append($typeLink);
        }

        for (const mimeType of mimeTypesService.getMimeTypes()) {
            if (!mimeType.enabled) {
                continue;
            }

            const $mimeLink = $('<a class="dropdown-item">')
                .attr("data-mime-type", mimeType.mime)
                .append('<span class="check">&check;</span> ')
                .append($("<span>").text(mimeType.title))
                .on("click", (e) => {
                    const $link = $(e.target).closest(".dropdown-item");

                    this.save("code", $link.attr("data-mime-type") ?? "");
                });

            if (this.note.type === "code" && this.note.mime === mimeType.mime) {
                $mimeLink.addClass("selected");

                this.$noteTypeDesc.text(mimeType.title);
            }

            this.$noteTypeDropdown.append($mimeLink);
        }
    }

    async findTypeTitle(type: NoteType, mime: string) {
        if (type === "code") {
            const mimeTypes = mimeTypesService.getMimeTypes();
            const found = mimeTypes.find((mt) => mt.mime === mime);

            return found ? found.title : mime;
        } else {
            const noteType = NOTE_TYPES.find((nt) => nt.type === type);

            return noteType ? noteType.title : type;
        }
    }

    async save(type: NoteType, mime?: string) {
        if (type === this.note?.type && mime === this.note?.mime) {
            return;
        }

        if (type !== this.note?.type && !(await this.confirmChangeIfContent())) {
            return;
        }

        await server.put(`notes/${this.noteId}/type`, { type, mime });
    }

    async confirmChangeIfContent() {
        if (!this.note) {
            return;
        }

        const blob = await this.note.getBlob();

        if (!blob?.content || !blob.content.trim().length) {
            return true;
        }

        return await dialogService.confirm(t("note_types.confirm-change"));
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isNoteReloaded(this.noteId)) {
            this.refresh();
        }
    }
}
