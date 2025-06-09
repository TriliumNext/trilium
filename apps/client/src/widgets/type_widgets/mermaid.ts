import type { EditorConfig } from "@triliumnext/codemirror";
import { getMermaidConfig, loadElkIfNeeded, postprocessMermaidSvg } from "../../services/mermaid.js";
import AbstractSvgSplitTypeWidget from "./abstract_svg_split_type_widget.js";

let idCounter = 1;
let registeredErrorReporter = false;

export class MermaidTypeWidget extends AbstractSvgSplitTypeWidget {

    static getType() {
        return "mermaid";
    }

    get attachmentName(): string {
        return "mermaid-export";
    }

    async renderSvg(content: string) {
        const mermaid = (await import("mermaid")).default;
        await loadElkIfNeeded(mermaid, content);
        if (!registeredErrorReporter) {
            // (await import("./linters/mermaid.js")).default();
            registeredErrorReporter = true;
        }

        mermaid.initialize({
            startOnLoad: false,
            ...(getMermaidConfig() as any),
        });

        idCounter++;
        const { svg } = await mermaid.render(`mermaid-graph-${idCounter}`, content);
        return postprocessMermaidSvg(svg);
    }

}
