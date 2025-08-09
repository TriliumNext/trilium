import ReactBasicWidget from "../react/ReactBasicWidget";
import Modal from "../react/Modal";
import { closeActiveDialog, openDialog } from "../../services/dialog";
import { t } from "../../services/i18n";
import FormGroup from "../react/FormGroup";
import NoteAutocomplete from "../react/NoteAutocomplete";
import FormList, { FormListHeader, FormListItem } from "../react/FormList";
import { useEffect, useState } from "preact/hooks";
import note_types from "../../services/note_types";
import { MenuCommandItem, MenuItem } from "../../menus/context_menu";
import { TreeCommandNames } from "../../menus/tree_context_menu";
import { Suggestion } from "../../services/note_autocomplete";
import Badge from "../react/Badge";

export interface ChooseNoteTypeResponse {
    success: boolean;
    noteType?: string;
    templateNoteId?: string;
    notePath?: string;
}

type Callback = (data: ChooseNoteTypeResponse) => void;

const SEPARATOR_TITLE_REPLACEMENTS = [
    t("note_type_chooser.builtin_templates"),
    t("note_type_chooser.templates")
];

interface NoteTypeChooserDialogProps {
    callback?: Callback;
}

function NoteTypeChooserDialogComponent({ callback }: NoteTypeChooserDialogProps) {
    const [ parentNote, setParentNote ] = useState<Suggestion>(); 
    const [ noteTypes, setNoteTypes ] = useState<MenuItem<TreeCommandNames>[]>([]);
    if (!noteTypes.length) {
        useEffect(() => {
            note_types.getNoteTypeItems().then(noteTypes => {
                let index = -1;

                setNoteTypes((noteTypes ?? []).map((item, _index) => {
                    if (item.title === "----") {
                        index++;
                        return {
                            title: SEPARATOR_TITLE_REPLACEMENTS[index],
                            enabled: false
                        }
                    }

                    return item;
                }));
            });
        });
    }

    function onNoteTypeSelected(value: string) {
        const [ noteType, templateNoteId ] = value.split(",");
        
        callback?.({
            success: true,
            noteType,
            templateNoteId,
            notePath: parentNote?.notePath
        });
        closeActiveDialog();
    }

    return (
        <Modal
            title={t("note_type_chooser.modal_title")}
            className="note-type-chooser-dialog"
            size="md"
            zIndex={1100} // note type chooser needs to be higher than other dialogs from which it is triggered, e.g. "add link"
            scrollable
            onHidden={() => callback?.({ success: false })}
        >
            <FormGroup label={t("note_type_chooser.change_path_prompt")}>
                <NoteAutocomplete
                    onChange={setParentNote}
                    placeholder={t("note_type_chooser.search_placeholder")}
                    opts={{
                        allowCreatingNotes: false,
                        hideGoToSelectedNoteButton: true,
                        allowJumpToSearchNotes: false,
                    }}
                />
            </FormGroup>

            <FormGroup label={t("note_type_chooser.modal_body")}>
                <FormList onSelect={onNoteTypeSelected}>
                    {noteTypes.map((_item) => {
                        if (_item.title === "----") {     
                            return;                       
                        }

                        const item = _item as MenuCommandItem<TreeCommandNames>;

                        if (item.enabled === false) {
                            return <FormListHeader text={item.title} />
                        } else {
                            return <FormListItem
                                value={[ item.type, item.templateNoteId ].join(",") }
                                icon={item.uiIcon}>
                                    {item.title}
                                    {item.badges && item.badges.map((badge) => <Badge {...badge} />)}
                                </FormListItem>;                            
                        }
                    })}
                </FormList>
            </FormGroup>
        </Modal>
    );
}

export default class NoteTypeChooserDialog extends ReactBasicWidget {

    private props: NoteTypeChooserDialogProps = {};

    get component() {
        return <NoteTypeChooserDialogComponent {...this.props} />
    }

    async chooseNoteTypeEvent({ callback }: { callback: Callback }) {
        this.props = { callback };
        this.doRender();
        openDialog(this.$widget);
    }

}
