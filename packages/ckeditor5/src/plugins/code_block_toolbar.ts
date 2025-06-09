import { CodeBlock, Plugin, ViewDocumentFragment, WidgetToolbarRepository, type ViewNode } from "ckeditor5";
import CodeBlockLanguageDropdown from "./code_block_language_dropdown";
import CopyToClipboardButton from "./copy_to_clipboard_button";

export default class CodeBlockToolbar extends Plugin {

    static get requires() {
        return [ WidgetToolbarRepository, CodeBlock, CodeBlockLanguageDropdown, CopyToClipboardButton ] as const;
    }

    afterInit() {
        const editor = this.editor;
        const widgetToolbarRepository = editor.plugins.get(WidgetToolbarRepository);

        widgetToolbarRepository.register("codeblock", {
            items: [
                "codeBlockDropdown",
                "|",
                "copyToClipboard"
            ],
            balloonClassName: "ck-toolbar-container codeblock-language-list",
            getRelatedElement(selection) {
                const selectionPosition = selection.getFirstPosition();
                if (!selectionPosition) {
                    return null;
                }

                let parent: ViewNode | ViewDocumentFragment | null = selectionPosition.parent;
                while (parent) {
                    if (parent.is("element", "pre")) {
                        return parent;
                    }

                    parent = parent.parent;
                }

                return null;
            }
        });
    }

}
