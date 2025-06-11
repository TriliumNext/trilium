import branchService from "./branches.js";
import toastService from "./toast.js";
import froca from "./froca.js";
import linkService from "./link.js";
import utils from "./utils.js";
import { t } from "./i18n.js";
import toast from "./toast.js";

let clipboardBranchIds: string[] = [];
let clipboardMode: string | null = null;

async function pasteAfter(afterBranchId: string) {
    if (isClipboardEmpty()) {
        return;
    }

    if (clipboardMode === "cut") {
        await branchService.moveAfterBranch(clipboardBranchIds, afterBranchId);

        clipboardBranchIds = [];
        clipboardMode = null;
    } else if (clipboardMode === "copy") {
        const clipboardBranches = clipboardBranchIds.map((branchId) => froca.getBranch(branchId));

        for (const clipboardBranch of clipboardBranches) {
            if (!clipboardBranch) {
                continue;
            }

            const clipboardNote = await clipboardBranch.getNote();
            if (!clipboardNote) {
                continue;
            }

            await branchService.cloneNoteAfter(clipboardNote.noteId, afterBranchId);
        }

        // copy will keep clipboardBranchIds and clipboardMode, so it's possible to paste into multiple places
    } else {
        toastService.throwError(`Unrecognized clipboard mode=${clipboardMode}`);
    }
}

async function pasteInto(parentBranchId: string) {
    if (isClipboardEmpty()) {
        return;
    }

    if (clipboardMode === "cut") {
        await branchService.moveToParentNote(clipboardBranchIds, parentBranchId);

        clipboardBranchIds = [];
        clipboardMode = null;
    } else if (clipboardMode === "copy") {
        const clipboardBranches = clipboardBranchIds.map((branchId) => froca.getBranch(branchId));

        for (const clipboardBranch of clipboardBranches) {
            if (!clipboardBranch) {
                continue;
            }

            const clipboardNote = await clipboardBranch.getNote();
            if (!clipboardNote) {
                continue;
            }

            await branchService.cloneNoteToBranch(clipboardNote.noteId, parentBranchId);
        }

        // copy will keep clipboardBranchIds and clipboardMode, so it's possible to paste into multiple places
    } else {
        toastService.throwError(`Unrecognized clipboard mode=${clipboardMode}`);
    }
}

async function copy(branchIds: string[]) {
    clipboardBranchIds = branchIds;
    clipboardMode = "copy";

    if (utils.isElectron()) {
        // https://github.com/zadam/trilium/issues/2401
        const { clipboard } = require("electron");
        const links: string[] = [];

        for (const branch of froca.getBranches(clipboardBranchIds)) {
            const $link = await linkService.createLink(`${branch.parentNoteId}/${branch.noteId}`, { referenceLink: true });
            links.push($link[0].outerHTML);
        }

        clipboard.writeHTML(links.join(", "));
    }

    toastService.showMessage(t("clipboard.copied"));
}

function cut(branchIds: string[]) {
    clipboardBranchIds = branchIds;

    if (clipboardBranchIds.length > 0) {
        clipboardMode = "cut";

        toastService.showMessage(t("clipboard.cut"));
    }
}

function isClipboardEmpty() {
    clipboardBranchIds = clipboardBranchIds.filter((branchId) => !!froca.getBranch(branchId));

    return clipboardBranchIds.length === 0;
}

export default {
    pasteAfter,
    pasteInto,
    cut,
    copy,
    isClipboardEmpty
};
