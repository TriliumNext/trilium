import { GPX, Marker, type LatLng, type LeafletMouseEvent } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget, { type InitCallback, type Leaflet } from "../geo_map.js";
import TypeWidget from "./type_widget.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import dialogService from "../../services/dialog.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import attributes from "../../services/attributes.js";
import openContextMenu from "./geo_map_context_menu.js";
import link from "../../services/link.js";
import note_tooltip from "../../services/note_tooltip.js";
import appContext from "../../components/app_context.js";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";
import { hasTouchBar } from "../../services/utils.js";

const TPL = /*html*/`\
<div class="note-detail-geo-map note-detail-printable">
    <style>
        .leaflet-pane {
            z-index: 1;
        }

        .geo-map-container.placing-note {
            cursor: crosshair;
        }

        .geo-map-container .marker-pin {
            position: relative;
        }

        .geo-map-container .leaflet-div-icon {
            position: relative;
            background: transparent;
            border: 0;
            overflow: visible;
        }

        .geo-map-container .leaflet-div-icon .icon-shadow {
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
        }

        .geo-map-container .leaflet-div-icon .bx {
            position: absolute;
            top: 3px;
            left: 2px;
            background-color: white;
            color: black;
            padding: 2px;
            border-radius: 50%;
            font-size: 17px;
        }

        .geo-map-container .leaflet-div-icon .title-label {
            display: block;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.75rem;
            height: 1rem;
            color: black;
            width: 100px;
            text-align: center;
            text-overflow: ellipsis;
            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
            white-space: no-wrap;
            overflow: hidden;
        }
    </style>
</div>`;

const LOCATION_ATTRIBUTE = "geolocation";
const CHILD_NOTE_ICON = "bx bx-pin";
const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;

interface MapData {
    view?: {
        center?: LatLng | [number, number];
        zoom?: number;
    };
}

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    };
}

enum State {
    Normal,
    NewNote
}

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;
    private _state: State;
    private L!: Leaflet;
    private currentMarkerData: Record<string, Marker>;
    private currentTrackData: Record<string, GPX>;
    private gpxLoaded?: boolean;
    private ignoreNextZoomEvent?: boolean;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", (L: Leaflet) => this.#onMapInitialized(L));
        this.currentMarkerData = {};
        this.currentTrackData = {};
        this._state = State.Normal;

        this.child(this.geoMapWidget);
    }

    doRender() {
        super.doRender();

        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());
    }

    async #onMapInitialized(L: Leaflet) {
        this.L = L;
        const map = this.geoMapWidget.map;
        if (!map) {
            throw new Error(t("geo-map.unable-to-load-map"));
        }

        this.#restoreViewportAndZoom();

        // Restore markers.
        await this.#reloadMarkers();

        // This fixes an issue with the map appearing cut off at the beginning, due to the container not being properly attached
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        const updateFn = () => this.spacedUpdate.scheduleUpdate();
        map.on("moveend", updateFn);
        map.on("zoomend", updateFn);
        map.on("click", (e) => this.#onMapClicked(e));

        if (hasTouchBar) {
            map.on("zoom", () => {
                if (!this.ignoreNextZoomEvent) {
                    this.triggerCommand("refreshTouchBar");
                }

                this.ignoreNextZoomEvent = false;
            });
        }
    }

    async #restoreViewportAndZoom() {
        const map = this.geoMapWidget.map;
        if (!map || !this.note) {
            return;
        }
        const blob = await this.note.getBlob();

        let parsedContent: MapData = {};
        if (blob && blob.content) {
            parsedContent = JSON.parse(blob.content);
        }

        // Restore viewport position & zoom
        const center = parsedContent.view?.center ?? DEFAULT_COORDINATES;
        const zoom = parsedContent.view?.zoom ?? DEFAULT_ZOOM;
        map.setView(center, zoom);
    }

    async #reloadMarkers() {
        if (!this.note) {
            return;
        }

        // Delete all existing markers
        for (const marker of Object.values(this.currentMarkerData)) {
            marker.remove();
        }

        // Delete all existing tracks
        for (const track of Object.values(this.currentTrackData)) {
            track.remove();
        }

        // Add the new markers.
        this.currentMarkerData = {};
        const childNotes = await this.note.getChildNotes();
        for (const childNote of childNotes) {
            if (childNote.mime === "application/gpx+xml") {
                this.#processNoteWithGpxTrack(childNote);
                continue;
            }

            const latLng = childNote.getAttributeValue("label", LOCATION_ATTRIBUTE);
            if (latLng) {
                this.#processNoteWithMarker(childNote, latLng);
            }
        }
    }

    async #processNoteWithGpxTrack(note: FNote) {
        if (!this.L || !this.geoMapWidget.map) {
            return;
        }

        if (!this.gpxLoaded) {
            await import("leaflet-gpx");
            this.gpxLoaded = true;
        }

        const xmlResponse = await server.get<string | Uint8Array>(`notes/${note.noteId}/open`, undefined, true);
        let stringResponse: string;
        if (xmlResponse instanceof Uint8Array) {
            stringResponse = new TextDecoder().decode(xmlResponse);
        } else {
            stringResponse = xmlResponse;
        }

        const track = new this.L.GPX(stringResponse, {
            markers: {
                startIcon: this.#buildIcon(note.getIcon(), note.getColorClass(), note.title),
                endIcon: this.#buildIcon("bxs-flag-checkered"),
                wptIcons: {
                    "": this.#buildIcon("bx bx-pin")
                }
            },
            polyline_options: {
                color: note.getLabelValue("color") ?? "blue"
            }
        });
        track.addTo(this.geoMapWidget.map);
        this.currentTrackData[note.noteId] = track;
    }

    #processNoteWithMarker(note: FNote, latLng: string) {
        const map = this.geoMapWidget.map;
        if (!map) {
            return;
        }

        const [lat, lng] = latLng.split(",", 2).map((el) => parseFloat(el));
        const L = this.L;
        const icon = this.#buildIcon(note.getIcon(), note.getColorClass(), note.title);

        const marker = L.marker(L.latLng(lat, lng), {
            icon,
            draggable: true,
            autoPan: true,
            autoPanSpeed: 5
        })
            .addTo(map)
            .on("moveend", (e) => {
                this.moveMarker(note.noteId, (e.target as Marker).getLatLng());
            });
        marker.on("mousedown", ({ originalEvent }) => {
            // Middle click to open in new tab
            if (originalEvent.button === 1) {
                const hoistedNoteId = this.hoistedNoteId;
                //@ts-ignore, fix once tab manager is ported.
                appContext.tabManager.openInNewTab(note.noteId, hoistedNoteId);
                return true;
            }
        });
        marker.on("contextmenu", (e) => {
            openContextMenu(note.noteId, e.originalEvent);
        });

        const el = marker.getElement();
        if (el) {
            const $el = $(el);
            $el.attr("data-href", `#${note.noteId}`);
            note_tooltip.setupElementTooltip($($el));
        }

        this.currentMarkerData[note.noteId] = marker;
    }

    #buildIcon(bxIconClass: string, colorClass?: string, title?: string) {
        return this.L.divIcon({
            html: /*html*/`\
                <img class="icon" src="${markerIcon}" />
                <img class="icon-shadow" src="${markerIconShadow}" />
                <span class="bx ${bxIconClass} ${colorClass ?? ""}"></span>
                <span class="title-label">${title ?? ""}</span>`,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });
    }

    #changeState(newState: State) {
        this._state = newState;
        this.geoMapWidget.$container.toggleClass("placing-note", newState === State.NewNote);
        if (hasTouchBar) {
            this.triggerCommand("refreshTouchBar");
        }
    }

    async #onMapClicked(e: LeafletMouseEvent) {
        if (this._state !== State.NewNote) {
            return;
        }

        toastService.closePersistent("geo-new-note");
        const title = await dialogService.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });

        if (title?.trim()) {
            const { note } = await server.post<CreateChildResponse>(`notes/${this.noteId}/children?target=into`, {
                title,
                content: "",
                type: "text"
            });
            attributes.setLabel(note.noteId, "iconClass", CHILD_NOTE_ICON);
            this.moveMarker(note.noteId, e.latlng);
        }

        this.#changeState(State.Normal);
    }

    async moveMarker(noteId: string, latLng: LatLng | null) {
        const value = latLng ? [latLng.lat, latLng.lng].join(",") : "";
        await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, value);
    }

    getData(): any {
        const map = this.geoMapWidget.map;
        if (!map) {
            return;
        }

        const data: MapData = {
            view: {
                center: map.getBounds().getCenter(),
                zoom: map.getZoom()
            }
        };

        return {
            content: JSON.stringify(data)
        };
    }

    async geoMapCreateChildNoteEvent({ ntxId }: EventData<"geoMapCreateChildNote">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        toastService.showPersistent({
            icon: "plus",
            id: "geo-new-note",
            title: "New note",
            message: t("geo-map.create-child-note-instruction")
        });

        this.#changeState(State.NewNote);

        const globalKeyListener: (this: Window, ev: KeyboardEvent) => any = (e) => {
            if (e.key !== "Escape") {
                return;
            }

            this.#changeState(State.Normal);

            window.removeEventListener("keydown", globalKeyListener);
            toastService.closePersistent("geo-new-note");
        };
        window.addEventListener("keydown", globalKeyListener);
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
        this.#restoreViewportAndZoom();
        await this.#reloadMarkers();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        // If any of the children branches are altered.
        if (loadResults.getBranchRows().find((branch) => branch.parentNoteId === this.noteId)) {
            this.#reloadMarkers();
            return;
        }

        // If any of note has its location attribute changed.
        // TODO: Should probably filter by parent here as well.
        const attributeRows = loadResults.getAttributeRows();
        if (attributeRows.find((at) => [LOCATION_ATTRIBUTE, "color"].includes(at.name ?? ""))) {
            this.#reloadMarkers();
        }
    }

    openGeoLocationEvent({ noteId, event }: EventData<"openGeoLocation">) {
        const marker = this.currentMarkerData[noteId];
        if (!marker) {
            return;
        }

        const latLng = this.currentMarkerData[noteId].getLatLng();
        const url = `geo:${latLng.lat},${latLng.lng}`;
        link.goToLinkExt(event, url);
    }

    deleteFromMapEvent({ noteId }: EventData<"deleteFromMap">) {
        this.moveMarker(noteId, null);
    }

    buildTouchBarCommand({ TouchBar }: CommandListenerData<"buildTouchBar">) {
        const map = this.geoMapWidget.map;
        const that = this;
        if (!map) {
            return;
        }

        return [
            new TouchBar.TouchBarSlider({
                label: "Zoom",
                value: map.getZoom(),
                minValue: map.getMinZoom(),
                maxValue: map.getMaxZoom(),
                change(newValue) {
                    that.ignoreNextZoomEvent = true;
                    map.setZoom(newValue);
                },
            }),
            new TouchBar.TouchBarButton({
                label: "New geo note",
                click: () => this.triggerCommand("geoMapCreateChildNote", { ntxId: this.ntxId }),
                enabled: (this._state === State.Normal)
            })
        ];
    }

}
