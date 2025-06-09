import TypeWidget from "./type_widget.js";
import utils from "../../services/utils.js";
import linkService from "../../services/link.js";
import server from "../../services/server.js";
import type FNote from "../../entities/fnote.js";
import options from "../../services/options.js";
import type { ExcalidrawElement, Theme } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFileData, ExcalidrawImperativeAPI, ExcalidrawProps, LibraryItem, SceneData } from "@excalidraw/excalidraw/types";
import type { JSX } from "react";
import type React from "react";
import type { Root } from "react-dom/client";
import "@excalidraw/excalidraw/index.css";
import asset_path from "../../asset_path.js";

const TPL = /*html*/`
    <div class="canvas-widget note-detail-canvas note-detail-printable note-detail">
        <style>
        .excalidraw .App-menu_top .buttonList {
            display: flex;
        }

        /* Conflict between excalidraw and bootstrap classes keeps the menu hidden */
        /* https://github.com/zadam/trilium/issues/3780 */
        /* https://github.com/excalidraw/excalidraw/issues/6567 */
        .excalidraw .dropdown-menu {
            display: block;
        }

        .excalidraw-wrapper {
            height: 100%;

        :root[dir="ltr"]
        .excalidraw
        .layer-ui__wrapper
        .zen-mode-transition.App-menu_bottom--transition-left {
            transform: none;
        }

        /* collaboration not possible so hide the button */
        .CollabButton {
            display: none !important;
        }

        .library-button {
            display: none !important; /* library won't work without extra support which isn't currently implemented */
        }

        </style>
        <!-- height here necessary. otherwise excalidraw not shown -->
        <div class="canvas-render" style="height: 100%"></div>
    </div>
`;

interface CanvasContent {
    elements: ExcalidrawElement[];
    files: BinaryFileData[];
    appState: Partial<AppState>;
}

interface AttachmentMetadata {
    title: string;
    attachmentId: string;
}

/**
 * # Canvas note with excalidraw
 * @author thfrei 2022-05-11
 *
 * Background:
 * excalidraw gives great support for hand-drawn notes. It also allows including images and support
 * for sketching. Excalidraw has a vibrant and active community.
 *
 * Functionality:
 * We store the excalidraw assets (elements and files) in the note. In addition to that, we
 * export the SVG from the canvas on every update and store it in the note's attachment. It is used when
 * calling api/images and makes referencing very easy.
 *
 * Paths not taken.
 *  - excalidraw-to-svg (node.js) could be used to avoid storing the svg in the backend.
 *    We could render the SVG on the fly. However, as of now, it does not render any hand drawn
 *    (freedraw) paths. There is an issue with Path2D object not present in the node-canvas library
 *    used by jsdom. (See Trilium PR for samples and other issues in the respective library.
 *    Link will be added later). Related links:
 *     - https://github.com/Automattic/node-canvas/pull/2013
 *     - https://github.com/google/canvas-5-polyfill
 *     - https://github.com/Automattic/node-canvas/issues/1116
 *     - https://www.npmjs.com/package/path2d-polyfill
 *  - excalidraw-to-svg (node.js) takes quite some time to load an image (1-2s)
 *  - excalidraw-utils (browser) does render freedraw, however NOT freedraw with a background. It is not
 *    used, since it is a big dependency, and has the same functionality as react + excalidraw.
 *  - infinite-drawing-canvas with fabric.js. This library lacked a lot of features, excalidraw already
 *    has.
 *
 * Known issues:
 *  - the 3 excalidraw fonts should be included in the share and everywhere, so that it is shown
 *    when requiring svg.
 *
 * Discussion of storing svg in the note attachment:
 *  - Pro: we will combat bit-rot. Showing the SVG will be very fast and easy, since it is already there.
 *  - Con: The note will get bigger (~40-50%?), we will generate more bandwidth. However, using trilium
 *         desktop instance mitigates that issue.
 *
 * Roadmap:
 *  - Support image-notes as reference in excalidraw
 *  - Support canvas note as reference (svg) in other canvas notes.
 *  - Make it easy to include a canvas note inside a text note
 */
export default class ExcalidrawTypeWidget extends TypeWidget {

    private readonly SCENE_VERSION_INITIAL: number;
    private readonly SCENE_VERSION_ERROR: number;

    private currentNoteId: string;
    private currentSceneVersion: number;
    private libraryChanged: boolean;
    private librarycache: LibraryItem[];
    private attachmentMetadata: AttachmentMetadata[];
    private themeStyle!: Theme;
    private excalidrawLib!: typeof import("@excalidraw/excalidraw");
    private excalidrawApi!: ExcalidrawImperativeAPI;
    private excalidrawWrapperRef!: React.RefObject<HTMLElement | null>;

    private $render!: JQuery<HTMLElement>;
    private root?: Root;
    private reactHandlers!: JQuery<HTMLElement>;

    constructor() {
        super();

        // constants
        this.SCENE_VERSION_INITIAL = -1; // -1 indicates that it is fresh. excalidraw scene version is always >0
        this.SCENE_VERSION_ERROR = -2; // -2 indicates error

        // currently required by excalidraw, in order to allows self-hosting fonts locally.
        // this avoids making excalidraw load the fonts from an external CDN.
        (window as any).EXCALIDRAW_ASSET_PATH = `${window.location.pathname}/node_modules/@excalidraw/excalidraw/dist/prod`;

        // temporary vars
        this.currentNoteId = "";
        this.currentSceneVersion = this.SCENE_VERSION_INITIAL;

        // will be overwritten
        this.$render;
        this.$widget;
        this.reactHandlers; // used to control react state

        this.libraryChanged = false;

        // these 2 variables are needed to compare the library state (all library items) after loading to the state when the library changed. So we can find attachments to be deleted.
        //every libraryitem is saved on its own json file in the attachments of the note.
        this.librarycache = [];
        this.attachmentMetadata = [];
    }

    static getType() {
        return "canvas";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.bind("mousewheel DOMMouseScroll", (event) => {
            if (event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });

        this.$widget.toggleClass("full-height", true);
        this.$render = this.$widget.find(".canvas-render");
        const documentStyle = window.getComputedStyle(document.documentElement);
        this.themeStyle = documentStyle.getPropertyValue("--theme-style")?.trim() as Theme;

        this.#init();

        return this.$widget;
    }

    async #init() {
        const renderElement = this.$render.get(0);
        if (!renderElement) {
            throw new Error("Unable to find element to render.");
        }

        // See https://github.com/excalidraw/excalidraw/issues/7899.
        if (!window.process) {
            (window.process as any) = {};
        }
        if (!window.process.env) {
            window.process.env = {};
        }
        (window.process.env as any).PREACT = false;

        const excalidraw = await import("@excalidraw/excalidraw");
        this.excalidrawLib = excalidraw;

        const { createRoot } = await import("react-dom/client");
        const React = (await import("react")).default;
        this.root?.unmount();
        this.root = createRoot(renderElement);
        this.root.render(React.createElement(() => this.createExcalidrawReactApp(React, excalidraw.Excalidraw)));
    }

    /**
     * called to populate the widget container with the note content
     */
    async doRefresh(note: FNote) {
        // see if the note changed, since we do not get a new class for a new note
        const noteChanged = this.currentNoteId !== note.noteId;
        if (noteChanged) {
            // reset the scene to omit unnecessary onchange handler
            this.currentSceneVersion = this.SCENE_VERSION_INITIAL;
        }
        this.currentNoteId = note.noteId;

        // get note from backend and put into canvas
        const blob = await note.getBlob();

        // before we load content into excalidraw, make sure excalidraw has loaded
        while (!this.excalidrawApi) {
            console.log("excalidrawApi not yet loaded, sleep 200ms...");
            await utils.sleep(200);
        }

        /**
         * new and empty note - make sure that canvas is empty.
         * If we do not set it manually, we occasionally get some "bleeding" from another
         * note into this fresh note. Probably due to that this note-instance does not get
         * newly instantiated?
         */
        if (!blob?.content?.trim()) {
            const sceneData: SceneData = {
                elements: [],
                appState: {
                    theme: this.themeStyle
                }
            };

            // TODO: Props mismatch.
            this.excalidrawApi.updateScene(sceneData as any);
        } else if (blob.content) {
            let content: CanvasContent;

            // load saved content into excalidraw canvas
            try {
                content = blob.getJsonContent() as CanvasContent;
            } catch (err) {
                console.error("Error parsing content. Probably note.type changed. Starting with empty canvas", note, blob, err);

                content = {
                    elements: [],
                    files: [],
                    appState: {}
                };
            }

            const { elements, files } = content;
            const appState: Partial<AppState> = content.appState ?? {};

            appState.theme = this.themeStyle;

            if (this.excalidrawWrapperRef.current) {
                const boundingClientRect = this.excalidrawWrapperRef.current.getBoundingClientRect();
                appState.width = boundingClientRect.width;
                appState.height = boundingClientRect.height;
                appState.offsetLeft = boundingClientRect.left;
                appState.offsetTop = boundingClientRect.top;
            }

            const sceneData: SceneData = {
                elements,
                appState
            };

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

            Promise.all(
                (await note.getAttachmentsByRole("canvasLibraryItem")).map(async (attachment) => {
                    const blob = await attachment.getBlob();
                    return {
                        blob, // Save the blob for libraryItems
                        metadata: {
                            // metadata to use in the cache variables for comparing old library state and new one. We delete unnecessary items later, calling the server directly
                            attachmentId: attachment.attachmentId,
                            title: attachment.title
                        }
                    };
                })
            ).then((results) => {
                if (note.noteId !== this.currentNoteId) {
                    // current note changed in the course of the async operation
                    return;
                }

                // Extract libraryItems from the blobs
                const libraryItems = results.map((result) => result?.blob?.getJsonContentSafely()).filter((item) => !!item) as LibraryItem[];

                // Extract metadata for each attachment
                const metadata = results.map((result) => result.metadata);

                // Update the library and save to independent variables
                this.excalidrawApi.updateLibrary({ libraryItems, merge: false });

                // save state of library to compare it to the new state later.
                this.librarycache = libraryItems;
                this.attachmentMetadata = metadata;
            });

            // Update the scene
            // TODO: Fix type of sceneData
            this.excalidrawApi.updateScene(sceneData as any);
            this.excalidrawApi.addFiles(fileArray);
            this.excalidrawApi.history.clear();
        }

        // set initial scene version
        if (this.currentSceneVersion === this.SCENE_VERSION_INITIAL) {
            this.currentSceneVersion = this.getSceneVersion();
        }
    }

    /**
     * gets data from widget container that will be sent via spacedUpdate.scheduleUpdate();
     * this is automatically called after this.saveData();
     */
    async getData() {
        const elements = this.excalidrawApi.getSceneElements();
        const appState = this.excalidrawApi.getAppState();

        /**
         * A file is not deleted, even though removed from canvas. Therefore, we only keep
         * files that are referenced by an element. Maybe this will change with a new excalidraw version?
         */
        const files = this.excalidrawApi.getFiles();

        // parallel svg export to combat bitrot and enable rendering image for note inclusion, preview, and share
        const svg = await this.excalidrawLib.exportToSvg({
            elements,
            appState,
            exportPadding: 5, // 5 px padding
            files
        });
        const svgString = svg.outerHTML;

        const activeFiles: Record<string, BinaryFileData> = {};
        // TODO: Used any where upstream typings appear to be broken.
        elements.forEach((element: any) => {
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

        const attachments = [{ role: "image", title: "canvas-export.svg", mime: "image/svg+xml", content: svgString, position: 0 }];

        if (this.libraryChanged) {
            // this.libraryChanged is unset in dataSaved()

            // there's no separate method to get library items, so have to abuse this one
            const libraryItems = await this.excalidrawApi.updateLibrary({
                libraryItems() {
                    return [];
                },
                merge: true
            });

            // excalidraw saves the library as a own state. the items are saved to libraryItems. then we compare the library right now with a libraryitemcache. The cache is filled when we first load the Library into the note.
            //We need the cache to delete old attachments later in the server.

            const libraryItemsMissmatch = this.librarycache.filter((obj1) => !libraryItems.some((obj2: LibraryItem) => obj1.id === obj2.id));

            // before we saved the metadata of the attachments in a cache. the title of the attachment is a combination of libraryitem  ´s ID und it´s name.
            // we compare the library items in the libraryitemmissmatch variable (this one saves all libraryitems that are different to the state right now. E.g. you delete 1 item, this item is saved as mismatch)
            // then we combine its id and title and search the according attachmentID.

            const matchingItems = this.attachmentMetadata.filter((meta) => {
                // Loop through the second array and check for a match
                return libraryItemsMissmatch.some((item) => {
                    // Combine the `name` and `id` from the second array
                    const combinedTitle = `${item.id}${item.name}`;
                    return meta.title === combinedTitle;
                });
            });

            // we save the attachment ID`s in a variable and delete every attachmentID. Now the items that the user deleted will be deleted.
            const attachmentIds = matchingItems.map((item) => item.attachmentId);

            //delete old attachments that are no longer used
            for (const item of attachmentIds) {
                await server.remove(`attachments/${item}`);
            }

            let position = 10;

            // prepare data to save to server e.g. new library items.
            for (const libraryItem of libraryItems) {
                attachments.push({
                    role: "canvasLibraryItem",
                    title: libraryItem.id + libraryItem.name,
                    mime: "application/json",
                    content: JSON.stringify(libraryItem),
                    position: position
                });

                position += 10;
            }
        }

        return {
            content: JSON.stringify(content),
            attachments
        };
    }

    /**
     * save content to backend
     */
    saveData() {
        // Since Excalidraw sends an enormous amount of events, wait for them to stop before actually saving.
        this.spacedUpdate.resetUpdateTimer();
        this.spacedUpdate.scheduleUpdate();
    }

    dataSaved() {
        this.libraryChanged = false;
    }

    onChangeHandler() {
        if (options.is("databaseReadonly")) {
            return;
        }
        // changeHandler is called upon any tiny change in excalidraw. button clicked, hover, etc.
        // make sure only when a new element is added, we actually save something.
        const isNewSceneVersion = this.isNewSceneVersion();
        /**
         * FIXME: however, we might want to make an exception, if viewport changed, since viewport
         *        is desired to save? (add) and appState background, and some things
         */

        // upon updateScene, onchange is called, even though "nothing really changed" that is worth saving
        const isNotInitialScene = this.currentSceneVersion !== this.SCENE_VERSION_INITIAL;

        const shouldSave = isNewSceneVersion && isNotInitialScene;

        if (shouldSave) {
            this.updateSceneVersion();
            this.saveData();
        }
    }

    createExcalidrawReactApp(react: typeof React, excalidrawComponent: React.MemoExoticComponent<(props: ExcalidrawProps) => JSX.Element>) {
        const excalidrawWrapperRef = react.useRef<HTMLElement>(null);
        this.excalidrawWrapperRef = excalidrawWrapperRef;
        const [dimensions, setDimensions] = react.useState<{ width?: number; height?: number }>({
            width: undefined,
            height: undefined
        });

        react.useEffect(() => {
            if (excalidrawWrapperRef.current) {
                const dimensions = {
                    width: excalidrawWrapperRef.current.getBoundingClientRect().width,
                    height: excalidrawWrapperRef.current.getBoundingClientRect().height
                };
                setDimensions(dimensions);
            }

            const onResize = () => {
                if (this.note?.type !== "canvas") {
                    return;
                }

                if (excalidrawWrapperRef.current) {
                    const dimensions = {
                        width: excalidrawWrapperRef.current.getBoundingClientRect().width,
                        height: excalidrawWrapperRef.current.getBoundingClientRect().height
                    };
                    setDimensions(dimensions);
                }
            };

            window.addEventListener("resize", onResize);

            return () => window.removeEventListener("resize", onResize);
        }, [excalidrawWrapperRef]);

        const onLinkOpen = react.useCallback<NonNullable<ExcalidrawProps["onLinkOpen"]>>((element, event) => {
            let link = element.link;
            if (!link) {
                return false;
            }

            if (link.startsWith("root/")) {
                link = "#" + link;
            }

            const { nativeEvent } = event.detail;

            event.preventDefault();

            return linkService.goToLinkExt(nativeEvent, link, null);
        }, []);

        return react.createElement(
            react.Fragment,
            null,
            react.createElement(
                "div",
                {
                    className: "excalidraw-wrapper",
                    ref: excalidrawWrapperRef
                },
                react.createElement(excalidrawComponent, {
                    // this makes sure that 1) manual theme switch button is hidden 2) theme stays as it should after opening menu
                    theme: this.themeStyle,
                    excalidrawAPI: (api: ExcalidrawImperativeAPI) => {
                        this.excalidrawApi = api;
                    },
                    onLibraryChange: () => {
                        this.libraryChanged = true;

                        this.saveData();
                    },
                    onChange: () => this.onChangeHandler(),
                    viewModeEnabled: options.is("databaseReadonly"),
                    zenModeEnabled: false,
                    gridModeEnabled: false,
                    isCollaborating: false,
                    detectScroll: false,
                    handleKeyboardGlobally: false,
                    autoFocus: false,
                    onLinkOpen,
                    UIOptions: {
                        canvasActions: {
                            saveToActiveFile: false,
                            export: false
                        }
                    }
                })
            )
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
        if (options.is("databaseReadonly")) {
            return false;
        }

        const sceneVersion = this.getSceneVersion();

        return (
            this.currentSceneVersion === this.SCENE_VERSION_INITIAL || // initial scene version update
            this.currentSceneVersion !== sceneVersion
        ); // ensure scene changed
    }

    getSceneVersion() {
        if (this.excalidrawApi) {
            const elements = this.excalidrawApi.getSceneElements();
            return this.excalidrawLib.getSceneVersion(elements);
        } else {
            return this.SCENE_VERSION_ERROR;
        }
    }

    updateSceneVersion() {
        this.currentSceneVersion = this.getSceneVersion();
    }
}
