import server from "./server.js";
import appContext, { type CommandNames } from "../components/app_context.js";
import shortcutService from "./shortcuts.js";
import type Component from "../components/component.js";

const keyboardActionRepo: Record<string, Action> = {};

// TODO: Deduplicate with server.
export interface Action {
    actionName: CommandNames;
    effectiveShortcuts: string[];
    scope: string;
}

const keyboardActionsLoaded = server.get<Action[]>("keyboard-actions").then((actions) => {
    actions = actions.filter((a) => !!a.actionName); // filter out separators

    for (const action of actions) {
        action.effectiveShortcuts = action.effectiveShortcuts.filter((shortcut) => !shortcut.startsWith("global:"));

        keyboardActionRepo[action.actionName] = action;
    }

    return actions;
});

async function getActions() {
    return await keyboardActionsLoaded;
}

async function getActionsForScope(scope: string) {
    const actions = await keyboardActionsLoaded;

    return actions.filter((action) => action.scope === scope);
}

async function setupActionsForElement(scope: string, $el: JQuery<HTMLElement>, component: Component) {
    const actions = await getActionsForScope(scope);

    for (const action of actions) {
        for (const shortcut of action.effectiveShortcuts) {
            shortcutService.bindElShortcut($el, shortcut, () => component.triggerCommand(action.actionName, { ntxId: appContext.tabManager.activeNtxId }));
        }
    }
}

getActionsForScope("window").then((actions) => {
    for (const action of actions) {
        for (const shortcut of action.effectiveShortcuts) {
            shortcutService.bindGlobalShortcut(shortcut, () => appContext.triggerCommand(action.actionName, { ntxId: appContext.tabManager.activeNtxId }));
        }
    }
});

async function getAction(actionName: string, silent = false) {
    await keyboardActionsLoaded;

    const action = keyboardActionRepo[actionName];

    if (!action) {
        if (silent) {
            console.debug(`Cannot find action '${actionName}'`);
        } else {
            throw new Error(`Cannot find action '${actionName}'`);
        }
    }

    return action;
}

function updateDisplayedShortcuts($container: JQuery<HTMLElement>) {
    //@ts-ignore
    //TODO: each() does not support async callbacks.
    $container.find("kbd[data-command]").each(async (i, el) => {
        const actionName = $(el).attr("data-command");
        if (!actionName) {
            return;
        }

        const action = await getAction(actionName, true);

        if (action) {
            const keyboardActions = action.effectiveShortcuts.join(", ");

            if (keyboardActions || $(el).text() !== "not set") {
                $(el).text(keyboardActions);
            }
        }
    });

    //@ts-ignore
    //TODO: each() does not support async callbacks.
    $container.find("[data-trigger-command]").each(async (i, el) => {
        const actionName = $(el).attr("data-trigger-command");
        if (!actionName) {
            return;
        }
        const action = await getAction(actionName, true);

        if (action) {
            const title = $(el).attr("title");
            const shortcuts = action.effectiveShortcuts.join(", ");

            if (title?.includes(shortcuts)) {
                return;
            }

            const newTitle = !title?.trim() ? shortcuts : `${title} (${shortcuts})`;

            $(el).attr("title", newTitle);
        }
    });
}

export default {
    updateDisplayedShortcuts,
    setupActionsForElement,
    getAction,
    getActions,
    getActionsForScope
};
