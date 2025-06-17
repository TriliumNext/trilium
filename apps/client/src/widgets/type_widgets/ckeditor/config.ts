import { ALLOWED_PROTOCOLS } from "../../../services/link.js";
import { MIME_TYPE_AUTO } from "@triliumnext/commons";
import { buildExtraCommands, type EditorConfig } from "@triliumnext/ckeditor5";
import { getHighlightJsNameForMime } from "../../../services/mime_types.js";
import options from "../../../services/options.js";
import { ensureMimeTypesForHighlighting, isSyntaxHighlightEnabled } from "../../../services/syntax_highlight.js";
import utils from "../../../services/utils.js";
import emojiDefinitionsUrl from "@triliumnext/ckeditor5/emoji_definitions/en.json?url";
import { copyTextWithToast } from "../../../services/clipboard_ext.js";
import getTemplates from "./snippets.js";

const TEXT_FORMATTING_GROUP = {
    label: "Text formatting",
    icon: "text"
};

export async function buildConfig(): Promise<EditorConfig> {
    return {
        image: {
            styles: {
                options: [
                    "inline",
                    "alignBlockLeft",
                    "alignCenter",
                    "alignBlockRight",
                    "alignLeft",
                    "alignRight",
                    "side"
                ]
            },
            resizeOptions: [
                {
                    name: "imageResize:original",
                    value: null,
                    icon: "original"
                },
                {
                    name: "imageResize:25",
                    value: "25",
                    icon: "small"
                },
                {
                    name: "imageResize:50",
                    value: "50",
                    icon: "medium"
                },
                {
                    name: "imageResize:75",
                    value: "75",
                    icon: "medium"
                }
            ],
            toolbar: [
                // Image styles, see https://ckeditor.com/docs/ckeditor5/latest/features/images/images-styles.html#demo.
                "imageStyle:inline",
                "imageStyle:alignCenter",
                {
                    name: "imageStyle:wrapText",
                    title: "Wrap text",
                    items: ["imageStyle:alignLeft", "imageStyle:alignRight"],
                    defaultItem: "imageStyle:alignRight"
                },
                {
                    name: "imageStyle:block",
                    title: "Block align",
                    items: ["imageStyle:alignBlockLeft", "imageStyle:alignBlockRight"],
                    defaultItem: "imageStyle:alignBlockLeft"
                },
                "|",
                "imageResize:25",
                "imageResize:50",
                "imageResize:original",
                "|",
                "toggleImageCaption"
            ],
            upload: {
                types: ["jpeg", "png", "gif", "bmp", "webp", "tiff", "svg", "svg+xml", "avif"]
            }
        },
        heading: {
            options: [
                { model: "paragraph" as const, title: "Paragraph", class: "ck-heading_paragraph" },
                // heading1 is not used since that should be a note's title
                { model: "heading2" as const, view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
                { model: "heading3" as const, view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
                { model: "heading4" as const, view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
                { model: "heading5" as const, view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
                { model: "heading6" as const, view: "h6", title: "Heading 6", class: "ck-heading_heading6" }
            ]
        },
        table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties", "toggleTableCaption"]
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true
            }
        },
        alignment: {
            options: [ "left", "right", "center", "justify"]
        },
        link: {
            defaultProtocol: "https://",
            allowedProtocols: ALLOWED_PROTOCOLS
        },
        emoji: {
            definitionsUrl: window.glob.isDev
                ? new URL(import.meta.url).origin + emojiDefinitionsUrl
                : emojiDefinitionsUrl
        },
        syntaxHighlighting: {
            loadHighlightJs: async () => {
                await ensureMimeTypesForHighlighting();
                return await import("@triliumnext/highlightjs");
            },
            mapLanguageName: getHighlightJsNameForMime,
            defaultMimeType: MIME_TYPE_AUTO,
            enabled: isSyntaxHighlightEnabled()
        },
        clipboard: {
            copy: copyTextWithToast
        },
        slashCommand: {
            removeCommands: [],
            dropdownLimit: Number.MAX_SAFE_INTEGER,
            extraCommands: buildExtraCommands()
        },
        template: {
            definitions: await getTemplates()
        },
        // This value must be kept in sync with the language defined in webpack.config.js.
        language: "en"
    };
}

export function buildToolbarConfig(isClassicToolbar: boolean) {
    if (utils.isMobile()) {
        return buildMobileToolbar();
    } else if (isClassicToolbar) {
        const multilineToolbar = utils.isDesktop() && options.get("textNoteEditorMultilineToolbar") === "true";
        return buildClassicToolbar(multilineToolbar);
    } else {
        return buildFloatingToolbar();
    }
}

export function buildMobileToolbar() {
    const classicConfig = buildClassicToolbar(false);
    const items: string[] = [];

    for (const item of classicConfig.toolbar.items) {
        if (typeof item === "object" && "items" in item) {
            for (const subitem of item.items) {
                items.push(subitem);
            }
        } else {
            items.push(item);
        }
    }

    return {
        ...classicConfig,
        toolbar: {
            ...classicConfig.toolbar,
            items
        }
    };
}

export function buildClassicToolbar(multilineToolbar: boolean) {
    // For nested toolbars, refer to https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/toolbar.html#grouping-toolbar-items-in-dropdowns-nested-toolbars.
    return {
        toolbar: {
            items: [
                "heading",
                "fontSize",
                "|",
                "bold",
                "italic",
                {
                    ...TEXT_FORMATTING_GROUP,
                    items: ["underline", "strikethrough", "|", "superscript", "subscript", "|", "kbd"]
                },
                "|",
                "fontColor",
                "fontBackgroundColor",
                "removeFormat",
                "|",
                "bulletedList",
                "numberedList",
                "todoList",
                "|",
                "blockQuote",
                "admonition",
                "insertTable",
                "|",
                "code",
                "codeBlock",
                "|",
                "footnote",
                {
                    label: "Insert",
                    icon: "plus",
                    items: ["imageUpload", "|", "link", "bookmark", "internallink", "includeNote", "|", "specialCharacters", "emoji", "math", "mermaid", "horizontalLine", "pageBreak", "dateTime"]
                },
                "|",
                "alignment",
                "outdent",
                "indent",
                "|",
                "insertTemplate",
                "markdownImport",
                "cuttonote",
                "findAndReplace"
            ],
            shouldNotGroupWhenFull: multilineToolbar
        }
    };
}

export function buildFloatingToolbar() {
    return {
        toolbar: {
            items: [
                "fontSize",
                "bold",
                "italic",
                "underline",
                {
                    ...TEXT_FORMATTING_GROUP,
                    items: [ "strikethrough", "|", "superscript", "subscript", "|", "kbd" ]
                },
                "|",
                "fontColor",
                "fontBackgroundColor",
                "|",
                "code",
                "link",
                "bookmark",
                "removeFormat",
                "internallink",
                "cuttonote"
            ]
        },

        blockToolbar: [
            "heading",
            "|",
            "bulletedList",
            "numberedList",
            "todoList",
            "|",
            "blockQuote",
            "admonition",
            "codeBlock",
            "insertTable",
            "footnote",
            {
                label: "Insert",
                icon: "plus",
                items: ["link", "bookmark", "internallink", "includeNote", "|", "math", "mermaid", "horizontalLine", "pageBreak", "dateTime"]
            },
            "|",
            "alignment",
            "outdent",
            "indent",
            "|",
            "insertTemplate",
            "imageUpload",
            "markdownImport",
            "specialCharacters",
            "emoji",
            "findAndReplace"
        ]
    };
}
