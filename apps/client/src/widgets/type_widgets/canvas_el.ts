import "@excalidraw/excalidraw/index.css";
import { Excalidraw, getSceneVersion, exportToSvg } from "@excalidraw/excalidraw";
import { createElement, render, unmountComponentAtNode } from "preact/compat";
import { AppState, BinaryFileData, ExcalidrawImperativeAPI, ExcalidrawProps, LibraryItem } from "@excalidraw/excalidraw/types";
import type { ComponentType } from "preact";
import { ExcalidrawElement, NonDeletedExcalidrawElement, Theme } from "@excalidraw/excalidraw/element/types";

export interface CanvasContent {
    elements: ExcalidrawElement[];
    files: BinaryFileData[];
    appState: Partial<AppState>;
}

/** Indicates that it is fresh. excalidraw scene version is always >0 */
const SCENE_VERSION_INITIAL = -1;

export default class Canvas {

    private currentSceneVersion: number;
    private opts: ExcalidrawProps;
    private excalidrawApi!: ExcalidrawImperativeAPI;
    private initializedPromise: JQuery.Deferred<void>;

    constructor(opts: ExcalidrawProps) {
        this.opts = opts;
        this.currentSceneVersion = SCENE_VERSION_INITIAL;
        this.initializedPromise = $.Deferred();
    }

    renderCanvas(targetEl: HTMLElement) {
        unmountComponentAtNode(targetEl);
        render(this.createCanvasElement({
            ...this.opts,
            excalidrawAPI: (api: ExcalidrawImperativeAPI) => {
                this.excalidrawApi = api;
                this.initializedPromise.resolve();
            },
        }), targetEl);
    }

    async waitForApiToBecomeAvailable() {
        while (!this.excalidrawApi) {
            await this.initializedPromise;
        }
    }

    private createCanvasElement(opts: ExcalidrawProps) {
        return createElement("div", { className: "excalidraw-wrapper", },
            createElement(Excalidraw as ComponentType<ExcalidrawProps>, opts)
        );
    }

    /**
     * needed to ensure, that multipleOnChangeHandler calls do not trigger a save.
     * we compare the scene version as suggested in:
     * https://github.com/excalidraw/excalidraw/issues/3014#issuecomment-778115329
     *
     * info: sceneVersions are not incrementing. it seems to be a pseudo-random number
     */
    isNewSceneVersion() {
        const sceneVersion = this.getSceneVersion();

        return (
            this.currentSceneVersion === SCENE_VERSION_INITIAL || // initial scene version update
            this.currentSceneVersion !== sceneVersion
        ); // ensure scene changed
    }

    getSceneVersion() {
        const elements = this.excalidrawApi.getSceneElements();
        return getSceneVersion(elements);
    }

    updateSceneVersion() {
        this.currentSceneVersion = this.getSceneVersion();
    }

    resetSceneVersion() {
        this.currentSceneVersion = SCENE_VERSION_INITIAL;
    }

    isInitialScene() {
        return this.currentSceneVersion === SCENE_VERSION_INITIAL;
    }

    resetScene(theme: Theme) {
        this.excalidrawApi.updateScene({
            elements: [],
            appState: {
                theme
            }
        });
    }

    loadData(content: CanvasContent, theme: Theme) {
        const { elements, files } = content;
        const appState: Partial<AppState> = content.appState ?? {};
        appState.theme = theme;

        // files are expected in an array when loading. they are stored as a key-index object
        // see example for loading here:
        // https://github.com/excalidraw/excalidraw/blob/c5a7723185f6ca05e0ceb0b0d45c4e3fbcb81b2a/src/packages/excalidraw/example/App.js#L68
        const fileArray: BinaryFileData[] = [];
        for (const fileId in files) {
            const file = files[fileId];
            // TODO: dataURL is replaceable with a trilium image url
            //       maybe we can save normal images (pasted) with base64 data url, and trilium images
            //       with their respective url! nice
            // file.dataURL = "http://localhost:8080/api/images/ltjOiU8nwoZx/start.png";
            fileArray.push(file);
        }

        // Update the scene
        // TODO: Fix type of sceneData
        this.excalidrawApi.updateScene({
            elements,
            appState: appState as AppState
        });
        this.excalidrawApi.addFiles(fileArray);
        this.excalidrawApi.history.clear();
    }

    async getData() {
        const elements = this.excalidrawApi.getSceneElements();
        const appState = this.excalidrawApi.getAppState();

        /**
         * A file is not deleted, even though removed from canvas. Therefore, we only keep
         * files that are referenced by an element. Maybe this will change with a new excalidraw version?
         */
        const files = this.excalidrawApi.getFiles();
        // parallel svg export to combat bitrot and enable rendering image for note inclusion, preview, and share
        const svg = await exportToSvg({
            elements,
            appState,
            exportPadding: 5, // 5 px padding
            files
        });
        const svgString = svg.outerHTML;

        const activeFiles: Record<string, BinaryFileData> = {};
        elements.forEach((element: NonDeletedExcalidrawElement) => {
            if ("fileId" in element && element.fileId) {
                activeFiles[element.fileId] = files[element.fileId];
            }
        });

        const content = {
            type: "excalidraw",
            version: 2,
            elements,
            files: activeFiles,
            appState: {
                scrollX: appState.scrollX,
                scrollY: appState.scrollY,
                zoom: appState.zoom
            }
        };

        return {
            content,
            svg: svgString
        }
    }

    async getLibraryItems() {
        return this.excalidrawApi.updateLibrary({
            libraryItems() {
                return [];
            },
            merge: true
        });
    }

    async updateLibrary(libraryItems: LibraryItem[]) {
        this.excalidrawApi.updateLibrary({ libraryItems, merge: false });
    }

}
