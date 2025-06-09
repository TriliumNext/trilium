import OnClickButtonWidget from "./onclick_button.js";
import linkContextMenuService from "../../menus/link_context_menu.js";
import utils from "../../services/utils.js";
import appContext from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";

export default class OpenNoteButtonWidget extends OnClickButtonWidget {

    private noteToOpen: FNote;

    constructor(noteToOpen: FNote) {
        super();

        this.noteToOpen = noteToOpen;

        this.title(() => utils.escapeHtml(this.noteToOpen.title))
            .icon(() => this.noteToOpen.getIcon())
            .onClick((widget, evt) => this.launch(evt))
            .onAuxClick((widget, evt) => this.launch(evt))
            .onContextMenu((evt) => {
                if (evt) {
                    linkContextMenuService.openContextMenu(this.noteToOpen.noteId, evt);
                }
            });
    }

    async launch(evt: JQuery.ClickEvent | JQuery.TriggeredEvent | JQuery.ContextMenuEvent) {
        if (evt.which === 3) {
            return;
        }
        const hoistedNoteId = this.getHoistedNoteId();
        const ctrlKey = utils.isCtrlKey(evt);

        if ((evt.which === 1 && ctrlKey) || evt.which === 2) {
            const activate = evt.shiftKey ? true : false;
            await appContext.tabManager.openInNewTab(this.noteToOpen.noteId, hoistedNoteId, activate);
        } else {
            await appContext.tabManager.openInSameTab(this.noteToOpen.noteId);
        }
    }

    getHoistedNoteId() {
        return this.noteToOpen.getRelationValue("hoistedNote") || appContext.tabManager.getActiveContext()?.hoistedNoteId;
    }

    initialRenderCompleteEvent() {
        // we trigger refresh above
    }
}
