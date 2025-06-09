import { getThemeById } from "@triliumnext/codemirror";
import type FNote from "../../entities/fnote.js";
import options from "../../services/options.js";
import TypeWidget from "./type_widget.js";
import CodeMirror, { type EditorConfig } from "@triliumnext/codemirror";
import type { EventData } from "../../components/app_context.js";

export const DEFAULT_PREFIX = "default:";

/**
 * An abstract {@link TypeWidget} which implements the CodeMirror editor, meant to be used as a parent for
 * widgets requiring the editor.
 *
 * The widget handles the loading and initialization of the CodeMirror editor, as well as some common
 * actions.
 *
 * The derived class must:
 *
 * - Define `$editor` in the constructor.
 * - Call `super.doRender()` in the extended class.
 * - Call `this._update(note, content)` in `#doRefresh(note)`.
 */
export default class AbstractCodeTypeWidget extends TypeWidget {

    protected $editor!: JQuery<HTMLElement>;
    protected codeEditor!: CodeMirror;

    doRender() {
        this.initialized = this.#initEditor();
    }

    async #initEditor() {
        this.codeEditor = new CodeMirror({
            parent: this.$editor[0],
            lineWrapping: options.is("codeLineWrapEnabled"),
            ...this.getExtraOpts()
        });

        // Load the theme.
        const themeId = options.get("codeNoteTheme");
        if (themeId?.startsWith(DEFAULT_PREFIX)) {
            const theme = getThemeById(themeId.substring(DEFAULT_PREFIX.length));
            if (theme) {
                await this.codeEditor.setTheme(theme);
            }
        }
    }

    /**
     * Can be extended in derived classes to add extra options to the CodeMirror constructor. The options are appended
     * at the end, so it is possible to override the default values introduced by the abstract editor as well.
     *
     * @returns the extra options to be passed to the CodeMirror constructor.
     */
    getExtraOpts(): Partial<EditorConfig> {
        return {};
    }

    /**
     * Called as soon as the CodeMirror library has been loaded and the editor was constructed. Can be extended in
     * derived classes to add additional functionality or to register event handlers.
     *
     * By default, it does nothing.
     */
    onEditorInitialized() {
        // Do nothing by default.
    }

    /**
     * Must be called by the derived classes in `#doRefresh(note)` in order to react to changes.
     *
     * @param the note that was changed.
     * @param new content of the note.
     */
    _update(note: { mime: string }, content: string) {
        this.codeEditor.setText(content);
        this.codeEditor.setMimeType(note.mime);
        this.codeEditor.clearHistory();
    }

    show() {
        this.$widget.show();
        this.updateBackgroundColor();
    }

    focus() {
        this.codeEditor.focus();
    }

    scrollToEnd() {
        this.codeEditor.scrollToEnd();
        this.codeEditor.focus();
    }

    cleanup() {
        if (this.codeEditor) {
            this.spacedUpdate.allowUpdateWithoutChange(() => {
                this.codeEditor.setText("");
            });
        }
        this.updateBackgroundColor("unset");
    }

    async executeWithCodeEditorEvent({ resolve, ntxId }: EventData<"executeWithCodeEditor">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.codeEditor);
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("codeNoteTheme")) {
            const themeId = options.get("codeNoteTheme");
            if (themeId?.startsWith(DEFAULT_PREFIX)) {
                const theme = getThemeById(themeId.substring(DEFAULT_PREFIX.length));
                if (theme) {
                    await this.codeEditor.setTheme(theme);
                }
                this.updateBackgroundColor();
            }
        }

        if (loadResults.isOptionReloaded("codeLineWrapEnabled")) {
            this.codeEditor.setLineWrapping(options.is("codeLineWrapEnabled"));
        }
    }

    updateBackgroundColor(color?: string) {
        if (this.note?.mime === "text/x-sqlite;schema=trilium") {
            // Don't apply a background color for SQL console notes.
            return;
        }

        const $editorEl = $(this.codeEditor.dom);
        this.$widget.closest(".scrolling-container").css("background-color", color ?? $editorEl.css("background-color"));
    }

}
