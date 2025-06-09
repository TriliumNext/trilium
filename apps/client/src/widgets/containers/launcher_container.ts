import FlexContainer from "./flex_container.js";
import froca from "../../services/froca.js";
import appContext, { type EventData } from "../../components/app_context.js";
import LauncherWidget from "./launcher.js";
import utils from "../../services/utils.js";

export default class LauncherContainer extends FlexContainer<LauncherWidget> {
    private isHorizontalLayout: boolean;

    constructor(isHorizontalLayout: boolean) {
        super(isHorizontalLayout ? "row" : "column");

        this.id("launcher-container");
        this.filling();
        this.isHorizontalLayout = isHorizontalLayout;

        this.load();
    }

    async load() {
        await froca.initializedPromise;

        const visibleLaunchersRootId = utils.isMobile() ? "_lbMobileVisibleLaunchers" : "_lbVisibleLaunchers";
        const visibleLaunchersRoot = await froca.getNote(visibleLaunchersRootId, true);

        if (!visibleLaunchersRoot) {
            console.log("Visible launchers root note doesn't exist.");

            return;
        }

        const newChildren: LauncherWidget[] = [];

        for (const launcherNote of await visibleLaunchersRoot.getChildNotes()) {
            try {
                const launcherWidget = new LauncherWidget(this.isHorizontalLayout);
                const success = await launcherWidget.initLauncher(launcherNote);

                if (success) {
                    newChildren.push(launcherWidget);
                }
            } catch (e) {
                console.error(e);
            }
        }

        this.children = [];
        this.child(...newChildren);

        this.$widget.empty();
        this.renderChildren();

        await this.handleEventInChildren("initialRenderComplete", {});

        const activeContext = appContext.tabManager.getActiveContext();

        if (activeContext) {
            await this.handleEvent("setNoteContext", {
                noteContext: activeContext
            });

            if (activeContext.notePath) {
                await this.handleEvent("noteSwitched", {
                    noteContext: activeContext,
                    notePath: activeContext.notePath
                });
            }
        }
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getBranchRows().find((branch) => branch.parentNoteId && froca.getNoteFromCache(branch.parentNoteId)?.isLaunchBarConfig())) {
            // changes in note placement require reload of all launchers, all other changes are handled by individual
            // launchers
            this.load();
        }
    }
}
