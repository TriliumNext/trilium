// ck-find-result and ck-find-result_selected are the styles ck-editor
// uses for highlighting matches, use the same one on CodeMirror
// for consistency
import utils from "../services/utils.js";
import type FindWidget from "./find.js";

const FIND_RESULT_SELECTED_CSS_CLASSNAME = "ck-find-result_selected";
const FIND_RESULT_CSS_CLASSNAME = "ck-find-result";

// TODO: Deduplicate.
interface Match {
    className: string;
    clear(): void;
    find(): {
        from: number;
        to: number;
    };
}

interface SearchParameters {
    searchTerm: string;
    matchCase: boolean;
    wholeWord: boolean;
}

export default class FindInCode {

    private parent: FindWidget;
    private searchParameters: SearchParameters | null = null;

    constructor(parent: FindWidget) {
        this.parent = parent;
    }

    async getCodeEditor() {
        return this.parent.noteContext?.getCodeEditor();
    }

    async performFind(searchTerm: string, matchCase: boolean, wholeWord: boolean) {
        const codeEditor = await this.getCodeEditor();
        if (!codeEditor) {
            return { totalFound: 0, currentFound: 0 };
        }

        this.searchParameters = {
            searchTerm,
            matchCase,
            wholeWord,
        };
        const { totalFound, currentFound } = await codeEditor.performFind(searchTerm, matchCase, wholeWord);
        return { totalFound, currentFound };
    }

    async findNext(direction: number, currentFound: number, nextFound: number) {
        const codeEditor = await this.getCodeEditor();
        if (!codeEditor) {
            return;
        }

        codeEditor.findNext(direction, currentFound, nextFound);
    }

    async findBoxClosed(totalFound: number, currentFound: number) {
        const codeEditor = await this.getCodeEditor();
        codeEditor?.cleanSearch();
        codeEditor?.focus();
    }

    async replace(replaceText: string) {
        const codeEditor = await this.getCodeEditor();
        await codeEditor?.replace(replaceText);
        this.rerunSearch();
    }

    async replaceAll(replaceText: string) {
        const codeEditor = await this.getCodeEditor();
        await codeEditor?.replaceAll(replaceText);
        this.rerunSearch();
    }

    private rerunSearch() {
        if (this.searchParameters) {
            this.performFind(
                this.searchParameters.searchTerm,
                this.searchParameters.matchCase,
                this.searchParameters.wholeWord);
        }
    }

}
