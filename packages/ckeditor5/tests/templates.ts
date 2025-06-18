import { it } from "vitest";
import { describe } from "vitest";
import { ClassicEditor } from "../src/index.js";
import { type BalloonEditor, type ButtonView, type Editor } from "ckeditor5";
import { beforeEach } from "vitest";
import { expect } from "vitest";

describe("Text snippets", () => {
    let editorElement: HTMLDivElement;
    let editor: Editor;

    beforeEach(async () => {
        editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

        console.log("Trigger each");

        editor = await ClassicEditor.create(editorElement, {
            licenseKey: "GPL",
            toolbar: {
                items: [
                    "insertTemplate"
                ]
            }
        });
    });

    it("uses correct translations", () => {
        const itemsWithButtonView = Array.from(editor.ui.view.toolbar?.items)
            .filter(item => "buttonView" in item)
            .map(item => (item.buttonView as ButtonView).label);

        expect(itemsWithButtonView).not.toContain("Insert template");
        expect(itemsWithButtonView).toContain("Insert text snippet");
    });
});

