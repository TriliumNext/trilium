# Note types
The note type is defined by the `type` column in <a class="reference-link" href="Database/notes.md">notes</a>.

Possible types:

<figure class="table" style="width:100%;"><table class="ck-table-resized"><colgroup><col> <col> <col> <col> <col></colgroup><thead><tr><th>Note Type</th><th><code>type</code> value</th><th>Corresponding MIME type</th><th>Content of the note's blob</th><th>Relevant attributes</th></tr></thead><tbody><tr><th>Text</th><td><code>text</code></td><td>&nbsp;</td><td>The HTML of the note.</td><td>&nbsp;</td></tr><tr><th><a href="https://github.com/zadam/trilium/wiki/Relation-map">Relation Map&nbsp;</a></th><td><code>relationMap</code></td><td><code>application/json</code></td><td><p>A JSON describing the note:</p><pre><code class="language-text-plain">{
    "notes": [
        {
            "noteId": "gFQDL11KEm9G",
            "x": 142,
            "y": 405
        },
        {
            "noteId": "8GcjEKyrrCgl",
            "x": 100.10406374385552,
            "y": 757.0364424520196
        }
    ],
    "transform": {
        "scale": 0.3,
        "x": 480.29766098682165,
        "y": 116.83892021963081
    }
}</code></pre></td><td>None</td></tr><tr><th><a href="https://github.com/zadam/trilium/wiki/Scripts">Render Note</a></th><td><code>render</code></td><td><code>text/html</code> or blank.</td><td>An empty blob.</td><td><code>~renderNote</code> pointing to the HTML note to render.</td></tr><tr><th>Canvas</th><td><code>canvas</code></td><td><code>application/json</code></td><td><pre><code class="language-text-plain">{
	"appState": {},
	"elemenets": {},
	"files": {},
	"type": "excalidraw",
	"version": 2
}</code></pre></td><td>None</td></tr><tr><th>Mermaid Diagram</th><td><code>mermaid</code></td><td><code>text/mermaid</code> or <code>text/plain</code></td><td>The plain text content of the Mermaid diagram.</td><td>None</td></tr><tr><th>Book</th><td><code>book</code></td><td><code>text/html</code> or blank.</td><td>An empty blob.</td><td><ul><li><code>#viewType</code> which can be either <code>grid</code> or <code>list</code>.</li><li><code>#expanded</code></li></ul><p>both options are shown to the user via the “Book Properties” ribbon widget.</p></td></tr><tr><th>Web View</th><td><code>webView</code></td><td>blank</td><td>An empty blob.</td><td><code>#webViewSrc</code> pointing to an URL to render.</td></tr><tr><th>Code</th><td><code>code</code></td><td>Depends on the language (e.g. <code>text/plain</code>, <code>text/x-markdown</code>, <code>text/x-c++src</code>).</td><td>The plain text content.</td><td>&nbsp;</td></tr></tbody></table></figure>