import type { RefObject } from "preact";

/**
 * Takes in a React ref and returns a corresponding JQuery selector.
 *
 * @param ref the React ref from which to obtain the jQuery selector.
 * @returns the corresponding jQuery selector.
 */
export function refToJQuerySelector<T extends HTMLElement>(ref: RefObject<T> | null): JQuery<T> {
    if (ref?.current) {
        return $(ref.current);
    } else {
        return $();
    }
}
