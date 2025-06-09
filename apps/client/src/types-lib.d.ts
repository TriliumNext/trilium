// TODO: Use real @types/ but that one generates a lot of errors.
declare module "draggabilly" {
    type DraggabillyEventData = {};
    interface MoveVector {
        x: number;
        y: number;
    }
    type DraggabillyCallback = (event: unknown, pointer: unknown, moveVector: MoveVector) => void;
    export default class Draggabilly {
        constructor(el: HTMLElement, opts: {
            axis: "x" | "y";
            handle: string;
            containment: HTMLElement
        });
        element: HTMLElement;
        on(event: "staticClick" | "dragStart" | "dragEnd" | "dragMove", callback: Callback);
        dragEnd();
        isDragging: boolean;
        positionDrag: () => void;
        destroy();
    }
}

declare module "@mind-elixir/node-menu" {
    export default mindmap;
}

declare module "katex/contrib/auto-render" {
    var renderMathInElement: (element: HTMLElement, options: {
        trust: boolean;
    }) => void;
    export default renderMathInElement;
}

import * as L from "leaflet";

declare module "leaflet" {
    interface GPXMarker {
        startIcon?: DivIcon | Icon | string | undefined;
        endIcon?: DivIcon | Icon | string | undefined;
        wptIcons?: {
            [key: string]: DivIcon | Icon | string;
        };
        wptTypeIcons?: {
            [key: string]: DivIcon | Icon | string;
        };
        pointMatchers?: Array<{ regex: RegExp; icon: DivIcon | Icon | string}>;
    }

    interface GPXOptions {
        markers?: GPXMarker | undefined;
    }
}
