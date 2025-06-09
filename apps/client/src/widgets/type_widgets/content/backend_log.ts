import server from "../../../services/server.js";
import AbstractCodeTypeWidget from "../abstract_code_type_widget.js";
import type { EventData } from "../../../components/app_context.js";
import type { EditorConfig } from "@triliumnext/codemirror";

const TPL = /*html*/`<div style="height: 100%; display: flex; flex-direction: column;">
    <style>
        .backend-log-editor {
            flex-grow: 1;
            width: 100%;
            border: none;
            resize: none;
            margin-bottom: 0;
        }
    </style>

    <pre class="backend-log-editor"></pre
</div>`;

export default class BackendLogWidget extends AbstractCodeTypeWidget {

    private $refreshBackendLog!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$editor = this.$widget.find(".backend-log-editor");
        super.doRender();
    }

    async refresh() {
        await this.load();
    }

    async refreshDataEvent({ ntxId }: EventData<"refreshData">) {
        if (ntxId !== this.noteContext?.ntxId) {
            return;
        }

        this.refresh();
    }

    getExtraOpts(): Partial<EditorConfig> {
        return {
            readOnly: true,
            preferPerformance: true
        };
    }

    async load() {
        const content = await server.get<string>("backend-log");
        await this.initialized;

        this._update(
            {
                mime: "text/plain"
            },
            content
        );
        this.show();
        this.scrollToEnd();
    }

}
