import debounce from "../common/debounce";
import parents from "../common/parents";
import parseHTML from "../common/parsehtml";


interface SearchResults {
    results: SearchResult[];
}

interface SearchResult {
    id: string;
    title: string;
    score: number;
    path: string;
}

function buildResultItem(result: SearchResult) {
    return `<a class="search-result-item" href="./${result.id}">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-note">${result.path || "Home"}</div>
            </a>`;
}


export default function setupSearch() {
    const searchInput: HTMLInputElement | null = document.querySelector(".search-input");
    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("keyup", debounce(async () => {
        // console.log("CHANGE EVENT");
        const ancestor = document.body.dataset.ancestorNoteId;
        const query = searchInput.value;
        if (query.length < 3) return;
        const resp = await fetch(`api/notes?search=${query}&ancestorNoteId=${ancestor}`);
        const json = await resp.json() as SearchResults;
        const results = json.results.slice(0, 5);
        const lines = [`<div class="search-results">`];
        for (const result of results) {
            lines.push(buildResultItem(result));
        }
        lines.push("</div>");

        const container = parseHTML(lines.join("")) as HTMLDivElement;
        // console.log(container, lines);
        const rect = searchInput.getBoundingClientRect();
        container.style.top = `${rect.bottom}px`;
        container.style.left = `${rect.left}px`;
        container.style.minWidth = `${rect.width}px`;

        const existing = document.querySelector(".search-results");
        if (existing) existing.replaceWith(container);
        else document.body.append(container);
    }, 500));

    window.addEventListener("click", e => {
        const existing = document.querySelector(".search-results");
        if (!existing) return;
        // If the click was anywhere search components ignore it
        if (parents(e.target as HTMLElement, ".search-results,.search-item").length) return;
        if (existing) existing.remove();
    });
}
