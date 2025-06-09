import { t } from "../services/i18n.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import NoteListRenderer from "../services/note_list_renderer.js";
import type FNote from "../entities/fnote.js";
import type { EventData } from "../components/app_context.js";

const TPL = /*html*/`
<div class="search-result-widget">
    <style>
    .search-result-widget {
        flex-grow: 100000;
        flex-shrink: 100000;
        min-height: 0;
        overflow: auto;
    }

    .search-result-widget .note-list {
        padding: 10px;
    }

    .search-no-results, .search-not-executed-yet {
        margin: 20px;
        padding: 20px;
    }
    </style>

    <div class="search-no-results alert alert-info">
        ${t("search_result.no_notes_found")}
    </div>

    <div class="search-not-executed-yet alert alert-info">
        ${t("search_result.search_not_executed")}
    </div>

    <div class="search-result-widget-content">
    </div>
</div>`;

export default class SearchResultWidget extends NoteContextAwareWidget {

    private $content!: JQuery<HTMLElement>;
    private $noResults!: JQuery<HTMLElement>;
    private $notExecutedYet!: JQuery<HTMLElement>;

    isEnabled() {
        return super.isEnabled() && this.note?.type === "search";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$content = this.$widget.find(".search-result-widget-content");
        this.$noResults = this.$widget.find(".search-no-results");
        this.$notExecutedYet = this.$widget.find(".search-not-executed-yet");
    }

    async refreshWithNote(note: FNote) {
        const noResults = note.getChildNoteIds().length === 0 && !!note.searchResultsLoaded;

        this.$content.empty();
        this.$noResults.toggle(noResults);
        this.$notExecutedYet.toggle(!note.searchResultsLoaded);

        if (noResults || !note.searchResultsLoaded) {
            return;
        }

        const noteListRenderer = new NoteListRenderer(this.$content, note, note.getChildNoteIds(), true);
        await noteListRenderer.renderList();
    }

    searchRefreshedEvent({ ntxId }: EventData<"searchRefreshed">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        this.refresh();
    }

    notesReloadedEvent({ noteIds }: EventData<"notesReloaded">) {
        if (this.noteId && noteIds.includes(this.noteId)) {
            this.refresh();
        }
    }
}
