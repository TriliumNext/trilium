/*
 * This defines a custom widget which displays number of words and characters in a current text note.
 * To be activated for a given note, add label 'wordCount' to the note, you can also make it inheritable and thus activate it for the whole subtree.
 * 
 * See it in action in "Books" and its subtree.
 */
const TPL = `<div style="padding: 10px; border-top: 1px solid var(--main-border-color); contain: none;">
    <strong>Word count: </strong>
    <span class="word-count"></span>

    &nbsp;

    <strong>Character count: </strong>
    <span class="character-count"></span>
</div>`;

class WordCountWidget extends api.NoteContextAwareWidget {
    get position() { return 100; } // higher value means position towards the bottom/right

    get parentWidget() { return 'center-pane'; }

    isEnabled() {
        return super.isEnabled()
            && this.note.type === 'text'
            && this.note.hasLabel('wordCount');
    }

    doRender() {
        this.$widget = $(TPL);
        this.$wordCount = this.$widget.find('.word-count');
        this.$characterCount = this.$widget.find('.character-count');
        return this.$widget;
    }

    async refreshWithNote(note) {
        const {content} = await note.getNoteComplement();

        const text = $(content).text(); // get plain text only

        const counts = this.getCounts(text);

        this.$wordCount.text(counts.words);
        this.$characterCount.text(counts.characters);
    }

    getCounts(text) {
        const chunks = text
            .split(/[\s-+:,/\\]+/)
            .filter(chunk => chunk !== '');

        let words;

        if (chunks.length === 1 && chunks[0] === '') {
            words = 0;
        }
        else {
            words = chunks.length;
        }

        const characters = chunks.join('').length;

        return {words, characters};
    }

    async entitiesReloadedEvent({loadResults}) {
        if (loadResults.isNoteContentReloaded(this.noteId)) {
            this.refresh();
        }
    }
}

module.exports = new WordCountWidget();