import NoteContextAwareWidget from "../note_context_aware_widget.js";
import treeService from "../../services/tree.js";
import linkService from "../../services/link.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { NotePathRecord } from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

const TPL = /*html*/`
<div class="note-paths-widget">
    <style>
    .note-paths-widget {
        padding: 12px;
        max-height: 300px;
        overflow-y: auto;
    }

    .note-path-list {
        margin-top: 10px;
    }

    .note-path-list .path-current a {
        font-weight: bold;
    }

    .note-path-list .path-archived a {
        color: var(--muted-text-color) !important;
    }

    .note-path-list .path-search a {
        font-style: italic;
    }
    </style>

    <div class="note-path-intro"></div>

    <ul class="note-path-list"></ul>

    <button class="btn btn-sm" data-trigger-command="cloneNoteIdsTo">${t("note_paths.clone_button")}</button>
</div>`;

export default class NotePathsWidget extends NoteContextAwareWidget {

    private $notePathIntro!: JQuery<HTMLElement>;
    private $notePathList!: JQuery<HTMLElement>;

    get name() {
        return "notePaths";
    }

    get toggleCommand() {
        return "toggleRibbonTabNotePaths";
    }

    getTitle() {
        return {
            show: true,
            title: t("note_paths.title"),
            icon: "bx bx-collection"
        };
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$notePathIntro = this.$widget.find(".note-path-intro");
        this.$notePathList = this.$widget.find(".note-path-list");
    }

    async refreshWithNote(note: FNote) {
        this.$notePathList.empty();

        if (!this.note || this.noteId === "root") {
            this.$notePathList.empty().append(await this.getRenderedPath(["root"]));

            return;
        }

        const sortedNotePaths = this.note.getSortedNotePathRecords(this.hoistedNoteId).filter((notePath) => !notePath.isHidden);

        if (sortedNotePaths.length > 0) {
            this.$notePathIntro.text(t("note_paths.intro_placed"));
        } else {
            this.$notePathIntro.text(t("note_paths.intro_not_placed"));
        }

        const renderedPaths: JQuery<HTMLElement>[] = [];

        for (const notePathRecord of sortedNotePaths) {
            const notePath = notePathRecord.notePath;

            renderedPaths.push(await this.getRenderedPath(notePath, notePathRecord));
        }

        this.$notePathList.empty().append(...renderedPaths);
    }

    async getRenderedPath(notePath: string[], notePathRecord: NotePathRecord | null = null) {
        const $pathItem = $("<li>");
        const pathSegments: string[] = [];
        const lastIndex = notePath.length - 1;

        for (let i = 0; i < notePath.length; i++) {
            const noteId = notePath[i];
            pathSegments.push(noteId);
            const title = await treeService.getNoteTitle(noteId);
            const $noteLink = await linkService.createLink(pathSegments.join("/"), { title });

            $noteLink.find("a").addClass("no-tooltip-preview tn-link");
            $pathItem.append($noteLink);

            if (i != lastIndex) {
                $pathItem.append(" / ");
            }
        }

        const icons: string[] = [];

        if (this.notePath === notePath.join("/")) {
            $pathItem.addClass("path-current");
        }

        if (!notePathRecord || notePathRecord.isInHoistedSubTree) {
            $pathItem.addClass("path-in-hoisted-subtree");
        } else {
            icons.push(`<span class="bx bx-trending-up" title="${t("note_paths.outside_hoisted")}"></span>`);
        }

        if (notePathRecord?.isArchived) {
            $pathItem.addClass("path-archived");

            icons.push(`<span class="bx bx-archive" title="${t("note_paths.archived")}"></span>`);
        }

        if (notePathRecord?.isSearch) {
            $pathItem.addClass("path-search");

            icons.push(`<span class="bx bx-search" title="${t("note_paths.search")}"></span>`);
        }

        if (icons.length > 0) {
            $pathItem.append(` ${icons.join(" ")}`);
        }

        return $pathItem;
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getBranchRows().find((branch) => branch.noteId === this.noteId) || (this.noteId != null && loadResults.isNoteReloaded(this.noteId))) {
            this.refresh();
        }
    }
}
