import type FNote from "../entities/fnote.js";
import { getCurrentLanguage } from "./i18n.js";
import { formatCodeBlocks } from "./syntax_highlight.js";

export default function renderDoc(note: FNote) {
    return new Promise<JQuery<HTMLElement>>((resolve) => {
        let docName = note.getLabelValue("docName");
        const $content = $("<div>");

        if (docName) {
            // find doc based on language
            const url = getUrl(docName, getCurrentLanguage());
            $content.load(url, (response, status) => {
                // fallback to english doc if no translation available
                if (status === "error") {
                    const fallbackUrl = getUrl(docName, "en");
                    $content.load(fallbackUrl, () => {
                        processContent(fallbackUrl, $content)
                        resolve($content);
                    });
                    return;
                }

                processContent(url, $content);
                resolve($content);
            });
        } else {
            resolve($content);
        }

        return $content;
    });
}

function processContent(url: string, $content: JQuery<HTMLElement>) {
    const dir = url.substring(0, url.lastIndexOf("/"));

    // Images are relative to the docnote but that will not work when rendered in the application since the path breaks.
    $content.find("img").each((i, el) => {
        const $img = $(el);
        $img.attr("src", dir + "/" + $img.attr("src"));
    });

    formatCodeBlocks($content);
}

function getUrl(docNameValue: string, language: string) {
    // Cannot have spaces in the URL due to how JQuery.load works.
    docNameValue = docNameValue.replaceAll(" ", "%20");

    const basePath = window.glob.isDev ? new URL(window.glob.assetPath).pathname : window.glob.assetPath;
    return `${basePath}/doc_notes/${language}/${docNameValue}.html`;
}
