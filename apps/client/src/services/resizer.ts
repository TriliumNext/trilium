import options from "./options.js";
import Split from "split.js"

export const DEFAULT_GUTTER_SIZE = 5;

let leftPaneWidth: number;
let reservedPx: number;
let layoutOrientation: string;
let leftInstance: ReturnType<typeof Split> | null;
let rightPaneWidth: number;
let rightInstance: ReturnType<typeof Split> | null;

function setupLeftPaneResizer(leftPaneVisible: boolean) {
    if (leftInstance) {
        leftInstance.destroy();
        leftInstance = null;
    }

    $("#left-pane").toggle(leftPaneVisible);

    layoutOrientation = layoutOrientation ?? options.get("layoutOrientation");
    reservedPx = reservedPx ?? (layoutOrientation === "vertical" ? ($("#launcher-pane").outerWidth() || 0) : 0);
    // Window resizing causes `window.innerWidth` to change, so `reservedWidth` needs to be recalculated each time.
    const reservedWidth = reservedPx / window.innerWidth * 100;
    if (!leftPaneVisible) {
        $("#rest-pane").css("width", layoutOrientation === "vertical" ? `${100 - reservedWidth}%` : "100%");
        return;
    }

    leftPaneWidth = leftPaneWidth ?? (options.getInt("leftPaneWidth") ?? 0);
    if (!leftPaneWidth || leftPaneWidth < 5) {
        leftPaneWidth = 5;
    }

    const restPaneWidth = 100 - leftPaneWidth - reservedWidth;
    if (leftPaneVisible) {
        // Delayed initialization ensures that all DOM elements are fully rendered and part of the layout,
        // preventing Split.js from retrieving incorrect dimensions due to #left-pane not being rendered yet,
        // which would cause the minSize setting to have no effect.
        requestAnimationFrame(() => {
            leftInstance = Split(["#left-pane", "#rest-pane"], {
                sizes: [leftPaneWidth, restPaneWidth],
                gutterSize: DEFAULT_GUTTER_SIZE,
                minSize: [150, 300],
                onDragEnd: (sizes) => {
                    leftPaneWidth = Math.round(sizes[0]);
                    options.save("leftPaneWidth", Math.round(sizes[0]));
                }
            });
        });
    }
}

function setupRightPaneResizer() {
    if (rightInstance) {
        rightInstance.destroy();
        rightInstance = null;
    }

    const rightPaneVisible = $("#right-pane").is(":visible");

    if (!rightPaneVisible) {
        $("#center-pane").css("width", "100%");

        return;
    }

    rightPaneWidth = rightPaneWidth ?? (options.getInt("rightPaneWidth") ?? 0);
    if (!rightPaneWidth || rightPaneWidth < 5) {
        rightPaneWidth = 5;
    }

    if (rightPaneVisible) {
        rightInstance = Split(["#center-pane", "#right-pane"], {
            sizes: [100 - rightPaneWidth, rightPaneWidth],
            gutterSize: DEFAULT_GUTTER_SIZE,
            minSize: [300, 180],
            onDragEnd: (sizes) => {
                rightPaneWidth = Math.round(sizes[1]);
                options.save("rightPaneWidth", Math.round(sizes[1]));
            }
        });
    }
}

export default {
    setupLeftPaneResizer,
    setupRightPaneResizer
};
