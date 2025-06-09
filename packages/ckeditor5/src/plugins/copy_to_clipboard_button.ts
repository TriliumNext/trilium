import { ButtonView, Command, Plugin } from "ckeditor5";
import copyIcon from "../icons/copy.svg?raw";

export default class CopyToClipboardButton extends Plugin {

    public init() {
        const editor = this.editor;
        editor.commands.add("copyToClipboard", new CopyToClipboardCommand(this.editor));

        const componentFactory = editor.ui.componentFactory;
        componentFactory.add("copyToClipboard", locale => {
            const button = new ButtonView(locale);
            button.set({
                tooltip: "Copy to clipboard",
                icon: copyIcon
            });

            this.listenTo(button, "execute", () => {
                editor.execute("copyToClipboard");
            });

            return button;
        });
    }

}

export class CopyToClipboardCommand extends Command {

    private executeCallback?: (text: string) => void;

    override execute(...args: Array<unknown>) {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;

        if (!this.executeCallback) {
            this.executeCallback = this.editor.config.get("clipboard")?.copy;
        }

        const codeBlockEl = selection.getFirstPosition()?.findAncestor("codeBlock");
        if (!codeBlockEl) {
            console.warn("Unable to find code block element to copy from.");
            return;
        }

        const codeText = Array.from(codeBlockEl.getChildren())
            .map(child => "data" in child ? child.data : "\n")
            .join("");

        if (codeText) {
            if (!this.executeCallback) {
                navigator.clipboard.writeText(codeText).then(() => {
                    console.log('Code block copied to clipboard');
                }).catch(err => {
                    console.error('Failed to copy code block', err);
                });
            } else {
                this.executeCallback(codeText);
            }
        } else {
            console.warn('No code block selected or found.');
        }
    }

}
