import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import AbstractCodeTypeWidget from "./abstract_code_type_widget.js";

const TPL = /*html*/`
<div class="note-detail-readonly-code note-detail-printable">
    <style>
    .note-detail-readonly-code {
        min-height: 50px;
        position: relative;
    }
    </style>

    <pre class="note-detail-readonly-code-content"></pre>
</div>`;

export default class ReadOnlyCodeTypeWidget extends AbstractCodeTypeWidget {

    static getType() {
        return "readOnlyCode";
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$editor = this.$widget.find(".note-detail-readonly-code-content");

        super.doRender();
    }

    async doRefresh(note: FNote) {
        const blob = await this.note?.getBlob();
        if (!blob) return;

        const isFormattable = note.type === "text" && this.noteContext?.viewScope?.viewMode === "source";
        const content = isFormattable ? this.format(blob.content) : blob.content;

        this._update(note, content);
        this.show();
    }

    getExtraOpts() {
        return {
            readOnly: true
        };
    }

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$editor);
    }

    format(html: string) {
        let indent = "\n";
        const tab = "\t";
        let i = 0;
        let pre: { indent: string; tag: string }[] = [];

        html = html
            .replace(new RegExp("<pre>((.|\\t|\\n|\\r)+)?</pre>"), function (x) {
                pre.push({ indent: "", tag: x });
                return "<--TEMPPRE" + i++ + "/-->";
            })
            .replace(new RegExp("<[^<>]+>[^<]?", "g"), function (x) {
                let ret;
                const tagRegEx = /<\/?([^\s/>]+)/.exec(x);
                let tag = tagRegEx ? tagRegEx[1] : "";
                let p = new RegExp("<--TEMPPRE(\\d+)/-->").exec(x);

                if (p) {
                    const pInd = parseInt(p[1]);
                    pre[pInd].indent = indent;
                }

                if (["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"].indexOf(tag) >= 0) {
                    // self closing tag
                    ret = indent + x;
                } else {
                    if (x.indexOf("</") < 0) {
                        //open tag
                        if (x.charAt(x.length - 1) !== ">") ret = indent + x.substr(0, x.length - 1) + indent + tab + x.substr(x.length - 1, x.length);
                        else ret = indent + x;
                        !p && (indent += tab);
                    } else {
                        //close tag
                        indent = indent.substr(0, indent.length - 1);
                        if (x.charAt(x.length - 1) !== ">") ret = indent + x.substr(0, x.length - 1) + indent + x.substr(x.length - 1, x.length);
                        else ret = indent + x;
                    }
                }
                return ret;
            });

        for (i = pre.length; i--;) {
            html = html.replace("<--TEMPPRE" + i + "/-->", pre[i].tag.replace("<pre>", "<pre>\n").replace("</pre>", pre[i].indent + "</pre>"));
        }

        return html.charAt(0) === "\n" ? html.substr(1, html.length - 1) : html;
    }
}
