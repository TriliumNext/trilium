import { closeActiveDialog, openDialog } from "../../services/dialog";
import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import Button from "../react/Button";
import NoteAutocomplete from "../react/NoteAutocomplete";
import { t } from "../../services/i18n";
import { useEffect, useRef, useState } from "preact/hooks";
import note_autocomplete, { Suggestion } from "../../services/note_autocomplete";
import appContext from "../../components/app_context";
import commandRegistry from "../../services/command_registry";
import { refToJQuerySelector } from "../react/react_utils";

const KEEP_LAST_SEARCH_FOR_X_SECONDS = 120;

type Mode = "last-search" | "recent-notes" | "commands";

interface JumpToNoteDialogProps {
    mode: Mode;
}

function JumpToNoteDialogComponent({ mode }: JumpToNoteDialogProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const autocompleteRef = useRef<HTMLInputElement>(null);
    const [ isCommandMode, setIsCommandMode ] = useState(mode === "commands");
    const [ text, setText ] = useState(isCommandMode ? "> " : "");

    useEffect(() => {
        setIsCommandMode(text.startsWith(">"));
    }, [ text ]);

    async function onItemSelected(suggestion: Suggestion) {
        if (suggestion.notePath) {
            appContext.tabManager.getActiveContext()?.setNote(suggestion.notePath);
        } else if (suggestion.commandId) {
            closeActiveDialog();
            await commandRegistry.executeCommand(suggestion.commandId);
        }
    }

    function onShown() {
        const $autoComplete = refToJQuerySelector(autocompleteRef);
        switch (mode) {
            case "last-search":
                // Fall-through if there is no text, in order to display the recent notes.
                if (text) {
                    break;
                }
            case "recent-notes":
                note_autocomplete.showRecentNotes($autoComplete);
                break;
            case "commands":
                note_autocomplete.showAllCommands($autoComplete);
                break;
        }

        $autoComplete
            .trigger("focus")
            .trigger("select");
    }

    return (
        <Modal
            className="jump-to-note-dialog"
            size="lg"
            title={<NoteAutocomplete
                placeholder={t("jump_to_note.search_placeholder")}
                inputRef={autocompleteRef}
                container={containerRef}
                text={text}
                opts={{
                    allowCreatingNotes: true,
                    hideGoToSelectedNoteButton: true,
                    allowJumpToSearchNotes: true,
                    isCommandPalette: true
                }}
                onTextChange={setText}
                onChange={onItemSelected}
                />}
            onShown={onShown}
            footer={!isCommandMode && <Button className="show-in-full-text-button" text={t("jump_to_note.search_button")} keyboardShortcut="Ctrl+Enter" />}
        >
            <div className="algolia-autocomplete-container jump-to-note-results" ref={containerRef}></div>
        </Modal>
    );
}

export default class JumpToNoteDialog extends ReactBasicWidget {

    private lastOpenedTs?: number;
    private props: JumpToNoteDialogProps = {
        mode: "last-search"
    };

    get component() {
        return <JumpToNoteDialogComponent {...this.props} />;
    }

    async openDialog(commandMode = false) {        
        this.lastOpenedTs = Date.now();
        
        let newMode: Mode;
        if (commandMode) {
            newMode = "commands";            
        } else if (Date.now() - this.lastOpenedTs > KEEP_LAST_SEARCH_FOR_X_SECONDS * 1000) {
            // if you open the Jump To dialog soon after using it previously, it can often mean that you
            // actually want to search for the same thing (e.g., you opened the wrong note at first try)
            // so we'll keep the content.
            // if it's outside of this time limit, then we assume it's a completely new search and show recent notes instead.
            newMode = "recent-notes";
        } else {
            newMode = "last-search";
        }

        if (this.props.mode !== newMode) {
            this.props.mode = newMode;
            this.doRender();
        }

        openDialog(this.$widget);
    }

    async jumpToNoteEvent() {
        await this.openDialog();
    }
    
    async commandPaletteEvent() {
        await this.openDialog(true);
    }

}