import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import toast from "../../services/toast.js";
import utils from "../../services/utils.js";
import ws from "../../services/ws.js";
import OnClickButtonWidget from "../buttons/onclick_button.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

/**
 * A specialization of `SplitTypeWidget` meant for note types that have a SVG preview.
 *
 * This adds the following functionality:
 *
 * - Automatic handling of the preview when content or the note changes via {@link renderSvg}.
 * - Built-in pan and zoom functionality with automatic re-centering.
 * - Automatically displays errors to the user if {@link renderSvg} failed.
 * - Automatically saves the SVG attachment.
 *
 */
export default abstract class AbstractSvgSplitTypeWidget extends AbstractSplitTypeWidget {

    private $renderContainer!: JQuery<HTMLElement>;
    private zoomHandler: () => void;
    private zoomInstance?: SvgPanZoom.Instance;
    private svg?: string;

    constructor() {
        super();
        this.zoomHandler = () => {
            if (this.zoomInstance) {
                this.zoomInstance.resize();
                this.zoomInstance.fit();
                this.zoomInstance.center();
            }
        }
    }

    doRender(): void {
        super.doRender();
        this.$renderContainer = $(`<div>`)
            .addClass("render-container")
            .css("height", "100%");
        this.$preview.append(this.$renderContainer);
        $(window).on("resize", this.zoomHandler);
    }

    async doRefresh(note: FNote) {
        super.doRefresh(note);

        const blob = await note?.getBlob();
        const content = blob?.content || "";
        this.onContentChanged(content, true);

        // Save the SVG when entering a note only when it does not have an attachment.
        this.note?.getAttachments().then((attachments) => {
            const attachmentName = `${this.attachmentName}.svg`;
            if (!attachments.find((a) => a.title === attachmentName)) {
                this.#saveSvg();
            }
        });
    }

    getData(): { content: string; } {
        const data = super.getData();
        this.onContentChanged(data.content, false);
        this.#saveSvg();
        return data;
    }

    /**
     * Triggers an update of the preview pane with the provided content.
     *
     * @param content the content that will be passed to `renderSvg` for rendering. It is not the SVG content.
     * @param recenter `true` to reposition the pan/zoom to fit the image and to center it.
     */
    async onContentChanged(content: string, recenter: boolean) {
        if (!this.note) {
            return;
        }

        let svg: string = "";
        try {
            svg = await this.renderSvg(content);

            // Rendering was succesful.
            this.setError(null);

            if (svg === this.svg) {
                return;
            }

            this.svg = svg;
            this.$renderContainer.html(svg);
        } catch (e: unknown) {
            // Rendering failed.
            this.setError((e as Error)?.message);
        }

        await this.#setupPanZoom(!recenter);
    }

    #saveSvg() {
        const payload = {
            role: "image",
            title: `${this.attachmentName}.svg`,
            mime: "image/svg+xml",
            content: this.svg,
            position: 0
        };

        server.post(`notes/${this.noteId}/attachments?matchBy=title`, payload);
    }

    cleanup(): void {
        this.#cleanUpZoom();
        $(window).off("resize", this.zoomHandler);
        super.cleanup();
    }

    /**
     * Called upon when the SVG preview needs refreshing, such as when the editor has switched to a new note or the content has switched.
     *
     * The method must return a valid SVG string that will be automatically displayed in the preview.
     *
     * @param content the content of the note, in plain text.
     */
    abstract renderSvg(content: string): Promise<string>;

    /**
     * Called to obtain the name of the note attachment (without .svg extension) that will be used for storing the preview.
     */
    abstract get attachmentName(): string;

    /**
     * @param preservePanZoom `true` to keep the pan/zoom settings of the previous image, or `false` to re-center it.
     */
    async #setupPanZoom(preservePanZoom: boolean) {
        // Clean up
        let pan: SvgPanZoom.Point | null = null;
        let zoom: number | null = null;
        if (preservePanZoom && this.zoomInstance) {
            // Store pan and zoom for same note, when the user is editing the note.
            pan = this.zoomInstance.getPan();
            zoom = this.zoomInstance.getZoom();
            this.#cleanUpZoom();
        }

        const $svgEl = this.$renderContainer.find("svg");

        // Fit the image to bounds
        $svgEl.attr("width", "100%")
            .attr("height", "100%")
            .css("max-width", "100%");

        if (!$svgEl.length) {
            return;
        }

        const svgPanZoom = (await import("svg-pan-zoom")).default;
        const zoomInstance = svgPanZoom($svgEl[0], {
            zoomEnabled: true,
            controlIconsEnabled: false
        });

        if (preservePanZoom && pan && zoom) {
            // Restore the pan and zoom.
            zoomInstance.zoom(zoom);
            zoomInstance.pan(pan);
        } else {
            // New instance, reposition properly.
            zoomInstance.resize();
            zoomInstance.center();
            zoomInstance.fit();
        }

        this.zoomInstance = zoomInstance;
    }

    buildSplitExtraOptions(): Split.Options {
        return {
            onDrag: () => this.zoomHandler?.()
        }
    }

    buildPreviewButtons(): OnClickButtonWidget[] {
        return [
            new OnClickButtonWidget()
                .icon("bx-zoom-in")
                .title(t("relation_map_buttons.zoom_in_title"))
                .titlePlacement("top")
                .onClick(() => this.zoomInstance?.zoomIn())
            , new OnClickButtonWidget()
                .icon("bx-zoom-out")
                .title(t("relation_map_buttons.zoom_out_title"))
                .titlePlacement("top")
                .onClick(() => this.zoomInstance?.zoomOut())
            , new OnClickButtonWidget()
                .icon("bx-crop")
                .title(t("relation_map_buttons.reset_pan_zoom_title"))
                .titlePlacement("top")
                .onClick(() => this.zoomHandler())
        ];
    }

    #cleanUpZoom() {
        if (this.zoomInstance) {
            this.zoomInstance.destroy();
            this.zoomInstance = undefined;
        }
    }

    async exportSvgEvent({ ntxId }: EventData<"exportSvg">) {
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid" || !this.svg) {
            return;
        }

        utils.downloadSvg(this.note.title, this.svg);
    }

    async exportPngEvent({ ntxId }: EventData<"exportPng">) {
        console.log("Export to PNG", this.noteContext?.noteId, ntxId, this.svg);
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid" || !this.svg) {
            console.log("Return");
            return;
        }

        try {
            await utils.downloadSvgAsPng(this.note.title, this.svg);
        } catch (e) {
            console.warn(e);
            toast.showError(t("svg.export_to_png"));
        }
    }

}
