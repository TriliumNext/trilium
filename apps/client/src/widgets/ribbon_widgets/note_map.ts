import NoteContextAwareWidget from "../note_context_aware_widget.js";
import NoteMapWidget from "../note_map.js";
import { t } from "../../services/i18n.js";

const TPL = /*html*/`
<div class="note-map-ribbon-widget">
    <style>
        .note-map-ribbon-widget {
            position: relative;
        }

        .note-map-ribbon-widget .note-map-container {
            height: 300px;
        }

        .note-map-ribbon-widget .open-full-button, .note-map-ribbon-widget .collapse-button {
            position: absolute;
            right: 5px;
            bottom: 5px;
            z-index: 1000;
        }

        .style-resolver {
            color: var(--muted-text-color);
            display: none;
        }
    </style>

    <button class="bx bx-arrow-to-bottom icon-action open-full-button" title="${t("note_map.open_full")}"></button>
    <button class="bx bx-arrow-to-top icon-action collapse-button" style="display: none;" title="${t("note_map.collapse")}"></button>

    <div class="note-map-container"></div>
</div>`;

export default class NoteMapRibbonWidget extends NoteContextAwareWidget {

    private openState!: "small" | "full";
    private noteMapWidget: NoteMapWidget;
    private $container!: JQuery<HTMLElement>;
    private $openFullButton!: JQuery<HTMLElement>;
    private $collapseButton!: JQuery<HTMLElement>;

    constructor() {
        super();

        this.noteMapWidget = new NoteMapWidget("ribbon");
        this.child(this.noteMapWidget);
    }

    get name() {
        return "noteMap";
    }

    get toggleCommand() {
        return "toggleRibbonTabNoteMap";
    }

    getTitle() {
        return {
            show: this.isEnabled(),
            title: t("note_map.title"),
            icon: "bx bxs-network-chart"
        };
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$container = this.$widget.find(".note-map-container");
        this.$container.append(this.noteMapWidget.render());

        this.openState = "small";

        this.$openFullButton = this.$widget.find(".open-full-button");
        this.$openFullButton.on("click", () => {
            this.setFullHeight();

            this.$openFullButton.hide();
            this.$collapseButton.show();

            this.openState = "full";

            this.noteMapWidget.setDimensions();
        });

        this.$collapseButton = this.$widget.find(".collapse-button");
        this.$collapseButton.on("click", () => {
            this.setSmallSize();

            this.$openFullButton.show();
            this.$collapseButton.hide();

            this.openState = "small";

            this.noteMapWidget.setDimensions();
        });

        const handleResize = () => {
            if (!this.noteMapWidget.graph) {
                // no graph has been even rendered
                return;
            }

            if (this.openState === "full") {
                this.setFullHeight();
            } else if (this.openState === "small") {
                this.setSmallSize();
            }
        };

        new ResizeObserver(handleResize).observe(this.$widget[0]);
    }

    setSmallSize() {
        const SMALL_SIZE_HEIGHT = 300;
        const width = this.$widget.width() ?? 0;

        this.$widget.find(".note-map-container").height(SMALL_SIZE_HEIGHT).width(width);
    }

    setFullHeight() {
        const { top } = this.$widget[0].getBoundingClientRect();

        const height = ($(window).height() ?? 0) - top;
        const width = this.$widget.width() ?? 0;

        this.$widget.find(".note-map-container")
            .height(height)
            .width(width);
    }
}
