import { t } from "../../../services/i18n.js";
import AbstractLauncher from "./abstract_launcher.js";
import dialogService from "../../../services/dialog.js";
import appContext from "../../../components/app_context.js";
import utils from "../../../services/utils.js";
import linkContextMenuService from "../../../menus/link_context_menu.js";
import type FNote from "../../../entities/fnote.js";

// we're intentionally displaying the launcher title and icon instead of the target,
// e.g. you want to make launchers to 2 mermaid diagrams which both have mermaid icon (ok),
// but on the launchpad you want them distinguishable.
// for titles, the note titles may follow a different scheme than maybe desirable on the launchpad
// another reason is the discrepancy between what user sees on the launchpad and in the config (esp. icons).
// The only downside is more work in setting up the typical case
// where you actually want to have both title and icon in sync, but for those cases there are bookmarks
export default class NoteLauncher extends AbstractLauncher {
    constructor(launcherNote: FNote) {
        super(launcherNote);

        this.title(() => this.launcherNote.title)
            .icon(() => this.launcherNote.getIcon())
            .onClick((widget, evt) => this.launch(evt))
            .onAuxClick((widget, evt) => this.launch(evt))
            .onContextMenu(async (evt) => {
                let targetNoteId = await Promise.resolve(this.getTargetNoteId());

                if (!targetNoteId || !evt) {
                    return;
                }

                const hoistedNoteId = this.getHoistedNoteId();

                linkContextMenuService.openContextMenu(targetNoteId, evt, {}, hoistedNoteId);
            });
    }

    async launch(evt?: JQuery.ClickEvent | JQuery.ContextMenuEvent | JQuery.TriggeredEvent) {
        // await because subclass overrides can be async
        const targetNoteId = await this.getTargetNoteId();
        if (!targetNoteId || evt?.which === 3) {
            return;
        }

        const hoistedNoteId = await this.getHoistedNoteId();
        if (!hoistedNoteId) {
            return;
        }

        if (!evt) {
            // keyboard shortcut
            // TODO: Fix once tabManager is ported.
            //@ts-ignore
            await appContext.tabManager.openInSameTab(targetNoteId, hoistedNoteId);
        } else {
            const ctrlKey = utils.isCtrlKey(evt);
            const activate = evt.shiftKey ? true : false;

            if ((evt.which === 1 && ctrlKey) || evt.which === 2) {
                // TODO: Fix once tabManager is ported.
                //@ts-ignore
                await appContext.tabManager.openInNewTab(targetNoteId, hoistedNoteId, activate);
            } else {
                // TODO: Fix once tabManager is ported.
                //@ts-ignore
                await appContext.tabManager.openInSameTab(targetNoteId, hoistedNoteId);
            }
        }
    }

    getTargetNoteId(): void | string | Promise<string | undefined> {
        const targetNoteId = this.launcherNote.getRelationValue("target");

        if (!targetNoteId) {
            dialogService.info(t("note_launcher.this_launcher_doesnt_define_target_note"));
            return;
        }

        return targetNoteId;
    }

    getHoistedNoteId() {
        return this.launcherNote.getRelationValue("hoistedNote") || appContext.tabManager.getActiveContext()?.hoistedNoteId;
    }

    getTitle() {
        const shortcuts = this.launcherNote
            .getLabels("keyboardShortcut")
            .map((l) => l.value)
            .filter((v) => !!v)
            .join(", ");

        let title = super.getTitle();
        if (shortcuts) {
            title += ` (${shortcuts})`;
        }

        return title;
    }
}
