"use strict";

import optionService from "./options.js";
import log from "./log.js";
import { isElectron, isMac } from "./utils.js";
import type { KeyboardShortcut } from "@triliumnext/commons";
import { t } from "i18next";

function getDefaultKeyboardActions() {
    if (!t("keyboard_actions.note-navigation")) {
        throw new Error("Keyboard actions loaded before translations.");
    }

    const DEFAULT_KEYBOARD_ACTIONS: KeyboardShortcut[] = [
        {
            separator: t("keyboard_actions.note-navigation")
        },
        {
            actionName: "backInNoteHistory",
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Left"] : ["Alt+Left"],
            description: t("keyboard_actions.back-in-note-history"),
            scope: "window"
        },
        {
            actionName: "forwardInNoteHistory",
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Right"] : ["Alt+Right"],
            description: t("keyboard_actions.forward-in-note-history"),
            scope: "window"
        },
        {
            actionName: "jumpToNote",
            defaultShortcuts: ["CommandOrControl+J"],
            description: t("keyboard_actions.open-jump-to-note-dialog"),
            scope: "window"
        },
        {
            actionName: "scrollToActiveNote",
            defaultShortcuts: ["CommandOrControl+."],
            description: t("keyboard_actions.scroll-to-active-note"),
            scope: "window"
        },
        {
            actionName: "quickSearch",
            defaultShortcuts: ["CommandOrControl+S"],
            description: t("keyboard_actions.quick-search"),
            scope: "window"
        },
        {
            actionName: "searchInSubtree",
            defaultShortcuts: ["CommandOrControl+Shift+S"],
            description: t("keyboard_actions.search-in-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "expandSubtree",
            defaultShortcuts: [],
            description: t("keyboard_actions.expand-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "collapseTree",
            defaultShortcuts: ["Alt+C"],
            description: t("keyboard_actions.collapse-tree"),
            scope: "window"
        },
        {
            actionName: "collapseSubtree",
            defaultShortcuts: ["Alt+-"],
            description: t("keyboard_actions.collapse-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "sortChildNotes",
            defaultShortcuts: ["Alt+S"],
            description: t("keyboard_actions.sort-child-notes"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.creating-and-moving-notes")
        },
        {
            actionName: "createNoteAfter",
            defaultShortcuts: ["CommandOrControl+O"],
            description: t("keyboard_actions.create-note-after"),
            scope: "window"
        },
        {
            actionName: "createNoteInto",
            defaultShortcuts: ["CommandOrControl+P"],
            description: t("keyboard_actions.create-note-into"),
            scope: "window"
        },
        {
            actionName: "createNoteIntoInbox",
            defaultShortcuts: ["global:CommandOrControl+Alt+P"],
            description: t("keyboard_actions.create-note-into-inbox"),
            scope: "window"
        },
        {
            actionName: "deleteNotes",
            defaultShortcuts: ["Delete"],
            description: t("keyboard_actions.delete-note"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUp",
            defaultShortcuts: isMac ? ["Alt+Up"] : ["CommandOrControl+Up"],
            description: t("keyboard_actions.move-note-up"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDown",
            defaultShortcuts: isMac ? ["Alt+Down"] : ["CommandOrControl+Down"],
            description: t("keyboard_actions.move-note-down"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUpInHierarchy",
            defaultShortcuts: isMac ? ["Alt+Left"] : ["CommandOrControl+Left"],
            description: t("keyboard_actions.move-note-up-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDownInHierarchy",
            defaultShortcuts: isMac ? ["Alt+Right"] : ["CommandOrControl+Right"],
            description: t("keyboard_actions.move-note-down-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "editNoteTitle",
            defaultShortcuts: ["Enter"],
            description: t("keyboard_actions.edit-note-title"),
            scope: "note-tree"
        },
        {
            actionName: "editBranchPrefix",
            defaultShortcuts: ["F2"],
            description: t("keyboard_actions.edit-branch-prefix"),
            scope: "note-tree"
        },
        {
            actionName: "cloneNotesTo",
            defaultShortcuts: ["CommandOrControl+Shift+C"],
            description: t("keyboard_actions.clone-notes-to"),
            scope: "window"
        },
        {
            actionName: "moveNotesTo",
            defaultShortcuts: ["CommandOrControl+Shift+X"],
            description: t("keyboard_actions.move-notes-to"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.note-clipboard")
        },

        {
            actionName: "copyNotesToClipboard",
            defaultShortcuts: ["CommandOrControl+C"],
            description: t("keyboard_actions.copy-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "pasteNotesFromClipboard",
            defaultShortcuts: ["CommandOrControl+V"],
            description: t("keyboard_actions.paste-notes-from-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "cutNotesToClipboard",
            defaultShortcuts: ["CommandOrControl+X"],
            description: t("keyboard_actions.cut-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "selectAllNotesInParent",
            defaultShortcuts: ["CommandOrControl+A"],
            description: t("keyboard_actions.select-all-notes-in-parent"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteAboveToSelection",
            defaultShortcuts: ["Shift+Up"],
            description: t("keyboard_actions.add-note-above-to-the-selection"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteBelowToSelection",
            defaultShortcuts: ["Shift+Down"],
            description: t("keyboard_actions.add-note-below-to-selection"),
            scope: "note-tree"
        },
        {
            actionName: "duplicateSubtree",
            defaultShortcuts: [],
            description: t("keyboard_actions.duplicate-subtree"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.tabs-and-windows")
        },
        {
            actionName: "openNewTab",
            defaultShortcuts: isElectron ? ["CommandOrControl+T"] : [],
            description: t("keyboard_actions.open-new-tab"),
            scope: "window"
        },
        {
            actionName: "closeActiveTab",
            defaultShortcuts: isElectron ? ["CommandOrControl+W"] : [],
            description: t("keyboard_actions.close-active-tab"),
            scope: "window"
        },
        {
            actionName: "reopenLastTab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+T"] : [],
            description: t("keyboard_actions.reopen-last-tab"),
            scope: "window"
        },
        {
            actionName: "activateNextTab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Tab", "CommandOrControl+PageDown"] : [],
            description: t("keyboard_actions.activate-next-tab"),
            scope: "window"
        },
        {
            actionName: "activatePreviousTab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+Tab", "CommandOrControl+PageUp"] : [],
            description: t("keyboard_actions.activate-previous-tab"),
            scope: "window"
        },
        {
            actionName: "openNewWindow",
            defaultShortcuts: [],
            description: t("keyboard_actions.open-new-window"),
            scope: "window"
        },
        {
            actionName: "toggleTray",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-tray"),
            scope: "window"
        },
        {
            actionName: "toggleZenMode",
            defaultShortcuts: ["F9"],
            description: t("keyboard_actions.toggle-zen-mode"),
            scope: "window"
        },
        {
            actionName: "firstTab",
            defaultShortcuts: ["CommandOrControl+1"],
            description: t("keyboard_actions.first-tab"),
            scope: "window"
        },
        {
            actionName: "secondTab",
            defaultShortcuts: ["CommandOrControl+2"],
            description: t("keyboard_actions.second-tab"),
            scope: "window"
        },
        {
            actionName: "thirdTab",
            defaultShortcuts: ["CommandOrControl+3"],
            description: t("keyboard_actions.third-tab"),
            scope: "window"
        },
        {
            actionName: "fourthTab",
            defaultShortcuts: ["CommandOrControl+4"],
            description: t("keyboard_actions.fourth-tab"),
            scope: "window"
        },
        {
            actionName: "fifthTab",
            defaultShortcuts: ["CommandOrControl+5"],
            description: t("keyboard_actions.fifth-tab"),
            scope: "window"
        },
        {
            actionName: "sixthTab",
            defaultShortcuts: ["CommandOrControl+6"],
            description: t("keyboard_actions.sixth-tab"),
            scope: "window"
        },
        {
            actionName: "seventhTab",
            defaultShortcuts: ["CommandOrControl+7"],
            description: t("keyboard_actions.seventh-tab"),
            scope: "window"
        },
        {
            actionName: "eigthTab",
            defaultShortcuts: ["CommandOrControl+8"],
            description: t("keyboard_actions.eight-tab"),
            scope: "window"
        },
        {
            actionName: "ninthTab",
            defaultShortcuts: ["CommandOrControl+9"],
            description: t("keyboard_actions.ninth-tab"),
            scope: "window"
        },
        {
            actionName: "lastTab",
            defaultShortcuts: [],
            description: t("keyboard_actions.last-tab"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.dialogs")
        },
        {
            actionName: "showNoteSource",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-note-source"),
            scope: "window"
        },
        {
            actionName: "showOptions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-options"),
            scope: "window"
        },
        {
            actionName: "showRevisions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-revisions"),
            scope: "window"
        },
        {
            actionName: "showRecentChanges",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-recent-changes"),
            scope: "window"
        },
        {
            actionName: "showSQLConsole",
            defaultShortcuts: ["Alt+O"],
            description: t("keyboard_actions.show-sql-console"),
            scope: "window"
        },
        {
            actionName: "showBackendLog",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-backend-log"),
            scope: "window"
        },
        {
            actionName: "showHelp",
            defaultShortcuts: ["F1"],
            description: t("keyboard_actions.show-help"),
            scope: "window"
        },
        {
            actionName: "showCheatsheet",
            defaultShortcuts: ["Shift+F1"],
            description: t("keyboard_actions.show-cheatsheet"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.text-note-operations")
        },

        {
            actionName: "addLinkToText",
            defaultShortcuts: ["CommandOrControl+L"],
            description: t("keyboard_actions.add-link-to-text"),
            scope: "text-detail"
        },
        {
            actionName: "followLinkUnderCursor",
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.follow-link-under-cursor"),
            scope: "text-detail"
        },
        {
            actionName: "insertDateTimeToText",
            defaultShortcuts: ["Alt+T"],
            description: t("keyboard_actions.insert-date-and-time-to-text"),
            scope: "text-detail"
        },
        {
            actionName: "pasteMarkdownIntoText",
            defaultShortcuts: [],
            description: t("keyboard_actions.paste-markdown-into-text"),
            scope: "text-detail"
        },
        {
            actionName: "cutIntoNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.cut-into-note"),
            scope: "text-detail"
        },
        {
            actionName: "addIncludeNoteToText",
            defaultShortcuts: [],
            description: t("keyboard_actions.add-include-note-to-text"),
            scope: "text-detail"
        },
        {
            actionName: "editReadOnlyNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.edit-readonly-note"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.attributes-labels-and-relations")
        },

        {
            actionName: "addNewLabel",
            defaultShortcuts: ["Alt+L"],
            description: t("keyboard_actions.add-new-label"),
            scope: "window"
        },
        {
            actionName: "addNewRelation",
            defaultShortcuts: ["Alt+R"],
            description: t("keyboard_actions.create-new-relation"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.ribbon-tabs")
        },

        {
            actionName: "toggleRibbonTabClassicEditor",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-classic-editor-toolbar"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBasicProperties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-basic-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBookProperties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-book-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabFileProperties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-file-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabImageProperties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-image-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabOwnedAttributes",
            defaultShortcuts: ["Alt+A"],
            description: t("keyboard_actions.toggle-owned-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabInheritedAttributes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-inherited-attributes"),
            scope: "window"
        },
        // TODO: Remove or change since promoted attributes have been changed.
        {
            actionName: "toggleRibbonTabPromotedAttributes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-promoted-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteMap",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-link-map"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteInfo",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-info"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNotePaths",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-paths"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabSimilarNotes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-similar-notes"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.other")
        },

        {
            actionName: "toggleRightPane",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-right-pane"),
            scope: "window"
        },
        {
            actionName: "printActiveNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.print-active-note"),
            scope: "window"
        },
        {
            actionName: "exportAsPdf",
            defaultShortcuts: [],
            description: t("keyboard_actions.export-as-pdf"),
            scope: "window"
        },
        {
            actionName: "openNoteExternally",
            defaultShortcuts: [],
            description: t("keyboard_actions.open-note-externally"),
            scope: "window"
        },
        {
            actionName: "renderActiveNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.render-active-note"),
            scope: "window"
        },
        {
            actionName: "runActiveNote",
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.run-active-note"),
            scope: "code-detail"
        },
        {
            actionName: "toggleNoteHoisting",
            defaultShortcuts: ["Alt+H"],
            description: t("keyboard_actions.toggle-note-hoisting"),
            scope: "window"
        },
        {
            actionName: "unhoist",
            defaultShortcuts: ["Alt+U"],
            description: t("keyboard_actions.unhoist"),
            scope: "window"
        },
        {
            actionName: "reloadFrontendApp",
            defaultShortcuts: ["F5", "CommandOrControl+R"],
            description: t("keyboard_actions.reload-frontend-app"),
            scope: "window"
        },
        {
            actionName: "openDevTools",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+I"] : [],
            description: t("keyboard_actions.open-dev-tools"),
            scope: "window"
        },
        {
            actionName: "findInText",
            defaultShortcuts: isElectron ? ["CommandOrControl+F"] : [],
            description: t("keyboard_actions.find-in-text"),
            scope: "window"
        },
        {
            actionName: "toggleLeftPane",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-left-note-tree-panel"),
            scope: "window"
        },
        {
            actionName: "toggleFullscreen",
            defaultShortcuts: ["F11"],
            description: t("keyboard_actions.toggle-full-screen"),
            scope: "window"
        },
        {
            actionName: "zoomOut",
            defaultShortcuts: isElectron ? ["CommandOrControl+-"] : [],
            description: t("keyboard_actions.zoom-out"),
            scope: "window"
        },
        {
            actionName: "zoomIn",
            description: t("keyboard_actions.zoom-in"),
            defaultShortcuts: isElectron ? ["CommandOrControl+="] : [],
            scope: "window"
        },
        {
            actionName: "zoomReset",
            description: t("keyboard_actions.reset-zoom-level"),
            defaultShortcuts: isElectron ? ["CommandOrControl+0"] : [],
            scope: "window"
        },
        {
            actionName: "copyWithoutFormatting",
            defaultShortcuts: ["CommandOrControl+Alt+C"],
            description: t("keyboard_actions.copy-without-formatting"),
            scope: "text-detail"
        },
        {
            actionName: "forceSaveRevision",
            defaultShortcuts: [],
            description: t("keyboard_actions.force-save-revision"),
            scope: "window"
        }
    ];

    /*
     * Apply macOS-specific tweaks.
     */
    const platformModifier = isMac ? "Meta" : "Ctrl";

    for (const action of DEFAULT_KEYBOARD_ACTIONS) {
        if (action.defaultShortcuts) {
            action.defaultShortcuts = action.defaultShortcuts.map((shortcut) => shortcut.replace("CommandOrControl", platformModifier));
        }
    }

    return DEFAULT_KEYBOARD_ACTIONS;
}

function getKeyboardActions() {
    const actions: KeyboardShortcut[] = JSON.parse(JSON.stringify(getDefaultKeyboardActions()));

    for (const action of actions) {
        action.effectiveShortcuts = action.defaultShortcuts ? action.defaultShortcuts.slice() : [];
    }

    for (const option of optionService.getOptions()) {
        if (option.name.startsWith("keyboardShortcuts")) {
            let actionName = option.name.substring(17);
            actionName = actionName.charAt(0).toLowerCase() + actionName.slice(1);

            const action = actions.find((ea) => ea.actionName === actionName);

            if (action) {
                try {
                    action.effectiveShortcuts = JSON.parse(option.value);
                } catch (e) {
                    log.error(`Could not parse shortcuts for action ${actionName}`);
                }
            } else {
                log.info(`Keyboard action ${actionName} found in database, but not in action definition.`);
            }
        }
    }

    return actions;
}

export default {
    getDefaultKeyboardActions,
    getKeyboardActions
};
