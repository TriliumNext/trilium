import type { OptionMap } from "@triliumnext/commons";
import OptionsWidget from "../options_widget";
import server from "../../../../services/server";
import CodeMirror, { getThemeById } from "@triliumnext/codemirror";
import { DEFAULT_PREFIX } from "../../abstract_code_type_widget";
import { t } from "../../../../services/i18n";
import { ColorThemes } from "@triliumnext/codemirror";

// TODO: Deduplicate
interface Theme {
    title: string;
    val: string;
}

type Response = Theme[];

const SAMPLE_MIME = "application/typescript";
const SAMPLE_CODE = `\
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorView, highlightActiveLine, keymap, lineNumbers, placeholder, ViewUpdate, type EditorViewConfig } from "@codemirror/view";
import { defaultHighlightStyle, StreamLanguage, syntaxHighlighting, indentUnit, bracketMatching, foldGutter } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { highlightSelectionMatches } from "@codemirror/search";
import { vim } from "@replit/codemirror-vim";
import byMimeType from "./syntax_highlighting.js";
import smartIndentWithTab from "./extensions/custom_tab.js";
import type { ThemeDefinition } from "./color_themes.js";

export { default as ColorThemes, type ThemeDefinition, getThemeById } from "./color_themes.js";

type ContentChangedListener = () => void;

export interface EditorConfig {
    parent: HTMLElement;
    placeholder?: string;
    lineWrapping?: boolean;
    vimKeybindings?: boolean;
    readOnly?: boolean;
    onContentChanged?: ContentChangedListener;
}

export default class CodeMirror extends EditorView {

    private config: EditorConfig;
    private languageCompartment: Compartment;
    private historyCompartment: Compartment;
    private themeCompartment: Compartment;

    constructor(config: EditorConfig) {
        const languageCompartment = new Compartment();
        const historyCompartment = new Compartment();
        const themeCompartment = new Compartment();

        let extensions: Extension[] = [];

        if (config.vimKeybindings) {
            extensions.push(vim());
        }

        extensions = [
            ...extensions,
            languageCompartment.of([]),
            themeCompartment.of([
                syntaxHighlighting(defaultHighlightStyle, { fallback: true })
            ]),
            highlightActiveLine(),
            highlightSelectionMatches(),
            bracketMatching(),
            lineNumbers(),
            foldGutter(),
            indentUnit.of(" ".repeat(4)),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                ...smartIndentWithTab
            ])
        ]

        super({
            parent: config.parent,
            extensions
        });
    }
}`;

const TPL = /*html*/`\
<div class="options-section">
    <h4>${t("code_theme.title")}</h4>

    <div class="form-group row">
        <div class="col-md-6">
            <label for="color-theme">${t("code_theme.color-scheme")}</label>
            <select id="color-theme" class="theme-select form-select"></select>
        </div>

        <div class="col-md-6 side-checkbox">
            <label class="form-check tn-checkbox">
                <input type="checkbox" class="word-wrap form-check-input" />
                ${t("code_theme.word_wrapping")}
            </label>
        </div>
    </div>

    <div class="note-detail-readonly-code-content">
    </div>

    <style>
        .options-section .note-detail-readonly-code-content {
            margin: 0;
        }

        .options-section .note-detail-readonly-code-content .cm-editor {
            height: 200px;
        }
    </style>
</div>
`;

export default class CodeTheme extends OptionsWidget {

    private $themeSelect!: JQuery<HTMLElement>;
    private $sampleEl!: JQuery<HTMLElement>;
    private $lineWrapEnabled!: JQuery<HTMLElement>;
    private editor?: CodeMirror;

    doRender() {
        this.$widget = $(TPL);
        this.$themeSelect = this.$widget.find(".theme-select");
        this.$themeSelect.on("change", async () => {
            const newTheme = String(this.$themeSelect.val());
            await server.put(`options/codeNoteTheme/${newTheme}`);
        });

        // Populate the list of themes.
        for (const theme of ColorThemes) {
            const option = $("<option>")
                .attr("value", `default:${theme.id}`)
                .text(theme.name);
            this.$themeSelect.append(option);
        }

        this.$sampleEl = this.$widget.find(".note-detail-readonly-code-content");
        this.$lineWrapEnabled = this.$widget.find(".word-wrap");
        this.$lineWrapEnabled.on("change", () => this.updateCheckboxOption("codeLineWrapEnabled", this.$lineWrapEnabled));
    }

    async #setupPreview(options: OptionMap) {
        if (!this.editor) {
            this.editor = new CodeMirror({
                parent: this.$sampleEl[0],
            });
        }
        this.editor.setText(SAMPLE_CODE);
        this.editor.setMimeType(SAMPLE_MIME);
        this.editor.setLineWrapping(options.codeLineWrapEnabled === "true");

        // Load the theme.
        const themeId = options.codeNoteTheme;
        if (themeId?.startsWith(DEFAULT_PREFIX)) {
            const theme = getThemeById(themeId.substring(DEFAULT_PREFIX.length));
            if (theme) {
                await this.editor.setTheme(theme);
            }
        }
    }

    async optionsLoaded(options: OptionMap) {
        this.$themeSelect.val(options.codeNoteTheme);
        this.#setupPreview(options);
        this.setCheckboxState(this.$lineWrapEnabled, options.codeLineWrapEnabled);
    }

}
