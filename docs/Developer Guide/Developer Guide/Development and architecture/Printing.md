# Printing
Note printing is handled by `note_detail.js`, in the `printActiveNoteEvent` method.

The application uses the [`print-this`](https://www.npmjs.com/package/print-this) library to isolate `.note-detail-printable:visible` and prepare it for printing.

Some scripts like KaTeX are manually injected in the footer, and the CSS to be used is manually defined. The most important one is `print.css`.

## Syntax highlighting

Syntax highlighting for code blocks is supported as well:

*   It works by injecting a Highlight.js stylesheet into the print.
*   The theme used is hard-coded (the _Visual Studio Light theme_, at the time of writing) in order not to have a dark background in print.
*   The Highlight.js library is not needed since the `.note-detail-printable` which is rendered already has the `.hljs` classes added to it in order to achieve the syntax highlighting.
*   The user's choice of whether to enable syntax highlighting is also respected.