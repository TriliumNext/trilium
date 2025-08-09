import { EventData } from "../../components/app_context";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import Modal from "../react/Modal";
import ReactBasicWidget from "../react/ReactBasicWidget";
import Button from "../react/Button";
import FormRadioGroup from "../react/FormRadioGroup";
import NoteAutocomplete from "../react/NoteAutocomplete";
import { useRef, useState } from "preact/hooks";
import tree from "../../services/tree";
import { useEffect } from "react";
import note_autocomplete, { Suggestion } from "../../services/note_autocomplete";
import type { default as TextTypeWidget } from "../type_widgets/editable_text.js";
import { logError } from "../../services/ws";
import FormGroup from "../react/FormGroup.js";
import { refToJQuerySelector } from "../react/react_utils";

type LinkType = "reference-link" | "external-link" | "hyper-link";

interface AddLinkDialogProps {
    text?: string;
    textTypeWidget?: TextTypeWidget;
}

function AddLinkDialogComponent({ text: _text, textTypeWidget }: AddLinkDialogProps) {
    const [ text, setText ] = useState(_text ?? "");
    const [ linkTitle, setLinkTitle ] = useState("");
    const hasSelection = textTypeWidget?.hasSelection();
    const [ linkType, setLinkType ] = useState<LinkType>(hasSelection ? "hyper-link" : "reference-link");
    const [ suggestion, setSuggestion ] = useState<Suggestion | null>(null);

    async function setDefaultLinkTitle(noteId: string) {
        const noteTitle = await tree.getNoteTitle(noteId);
        setLinkTitle(noteTitle);
    }

    function resetExternalLink() {
        if (linkType === "external-link") {
            setLinkType("reference-link");
        }
    }

    useEffect(() => {
        if (!suggestion) {
            resetExternalLink();
            return;
        }

        if (suggestion.notePath) {
            const noteId = tree.getNoteIdFromUrl(suggestion.notePath);
            if (noteId) {
                setDefaultLinkTitle(noteId);
            }
            resetExternalLink();
        }

        if (suggestion.externalLink) {
            setLinkTitle(suggestion.externalLink);
            setLinkType("external-link");
        }
    }, [suggestion]);

    function onShown() {
        const $autocompleteEl = refToJQuerySelector(autocompleteRef);
        if (!text) {
            note_autocomplete.showRecentNotes($autocompleteEl);
        } else {
            note_autocomplete.setText($autocompleteEl, text);
        }

        // to be able to quickly remove entered text
        $autocompleteEl
            .trigger("focus")
            .trigger("select");
    }

    function onSubmit() {
        if (suggestion?.notePath) {
            // Handle note link
            closeActiveDialog();
            textTypeWidget?.addLink(suggestion.notePath, linkType === "reference-link" ? null : linkTitle);
        } else if (suggestion?.externalLink) {
            // Handle external link
            closeActiveDialog();
            textTypeWidget?.addLink(suggestion.externalLink, linkTitle, true);
        } else {
            logError("No link to add.");
        }
    }

    const autocompleteRef = useRef<HTMLInputElement>(null);

    return (
        <Modal
            className="add-link-dialog"
            size="lg"
            maxWidth={1000}
            title={t("add_link.add_link")}
            helpPageId="QEAPj01N5f7w"
            footer={<Button text={t("add_link.button_add_link")} keyboardShortcut="Enter" />}
            onSubmit={onSubmit}
            onShown={onShown}
            onHidden={() => setSuggestion(null)}
        >
            <FormGroup label={t("add_link.note")}>
                <NoteAutocomplete
                    inputRef={autocompleteRef}
                    text={text}
                    onChange={setSuggestion}
                    opts={{
                        allowExternalLinks: true,
                        allowCreatingNotes: true
                    }}
                />
            </FormGroup>

            {!hasSelection && (
                <div className="add-link-title-settings">
                    {(linkType !== "external-link") && (
                        <>
                            <FormRadioGroup
                                name="link-type"
                                currentValue={linkType}
                                values={[
                                    { value: "reference-link", label: t("add_link.link_title_mirrors") },
                                    { value: "hyper-link", label: t("add_link.link_title_arbitrary") }
                                ]}
                                onChange={(newValue) => setLinkType(newValue as LinkType)}
                            />
                        </>
                    )}

                    {(linkType !== "reference-link" && (
                        <div className="add-link-title-form-group form-group">
                            <br/>
                            <label>
                                {t("add_link.link_title")}

                                <input className="link-title form-control" style={{ width: "100%" }}
                                    value={linkTitle}
                                    onInput={(e: any) => setLinkTitle(e.target.value)}
                                />
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}

export default class AddLinkDialog extends ReactBasicWidget {

    private props: AddLinkDialogProps = {};
    
    get component() {
        return <AddLinkDialogComponent {...this.props} />;
    }

    async showAddLinkDialogEvent({ textTypeWidget, text = "" }: EventData<"showAddLinkDialog">) {
        this.props.text = text;
        this.props.textTypeWidget = textTypeWidget;
        this.doRender();
        await openDialog(this.$widget);
    }

}
