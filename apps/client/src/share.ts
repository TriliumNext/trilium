import "normalize.css";
import "boxicons/css/boxicons.min.css";
import "@triliumnext/ckeditor5/content.css";
import "@triliumnext/share-theme/styles/index.css";
import "@triliumnext/share-theme/scripts/index.js";

async function ensureJQuery() {
    const $ = (await import("jquery")).default;
    (window as any).$ = $;
}

async function applyMath() {
    const anyMathBlock = document.querySelector("#content .math-tex");
    if (!anyMathBlock) {
        return;
    }

    const renderMathInElement = (await import("./services/math.js")).renderMathInElement;
    renderMathInElement(document.getElementById("content"));
}

async function formatCodeBlocks() {
    const anyCodeBlock = document.querySelector("#content pre");
    if (!anyCodeBlock) {
        return;
    }
    await ensureJQuery();
    const { formatCodeBlocks } = await import("./services/syntax_highlight.js");
    await formatCodeBlocks($("#content"));
}

/**
 * Fetch note with given ID from backend
 *
 * @param noteId of the given note to be fetched. If false, fetches current note.
 */
async function fetchNote(noteId: string | null = null) {
    if (!noteId) {
        noteId = document.body.getAttribute("data-note-id");
    }

    const resp = await fetch(`api/notes/${noteId}`);

    return await resp.json();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        formatCodeBlocks();
        applyMath();

        const toggleMenuButton = document.getElementById("toggleMenuButton");
        const layout = document.getElementById("layout");

        if (toggleMenuButton && layout) {
            toggleMenuButton.addEventListener("click", () => layout.classList.toggle("showMenu"));
        }
    },
    false
);

// workaround to prevent webpack from removing "fetchNote" as dead code:
// add fetchNote as property to the window object
Object.defineProperty(window, "fetchNote", {
    value: fetchNote
});
