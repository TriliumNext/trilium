import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EventData, EventNames } from "../../components/app_context";
import { ParentComponent } from "./ReactBasicWidget";
import SpacedUpdate from "../../services/spaced_update";

export default function useTriliumEvent<T extends EventNames>(eventName: T, handler: (data: EventData<T>) => void) {
    const parentWidget = useContext(ParentComponent);
    useEffect(() => {
        if (!parentWidget) {
            console.warn("useTriliumEvent: No widget context found");
            return;
        }

        // Create a unique handler name for this specific event listener
        const handlerName = `${eventName}Event`;
        const originalHandler = parentWidget[handlerName];

        // Override the event handler to call our handler
        parentWidget[handlerName] = async function(data: EventData<T>) {
            // Call original handler if it exists
            if (originalHandler) {
                await originalHandler.call(parentWidget, data);
            }
            // Call our React component's handler
            handler(data);
        };

        // Cleanup: restore original handler on unmount
        return () => {
            parentWidget[handlerName] = originalHandler;
        };
    }, [parentWidget]);
}

export function useSpacedUpdate(callback: () => Promise<void>, interval = 1000) {
    const callbackRef = useRef(callback);
    const spacedUpdateRef = useRef<SpacedUpdate>();

    // Update callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    });

    // Create SpacedUpdate instance only once
    if (!spacedUpdateRef.current) {
        spacedUpdateRef.current = new SpacedUpdate(
            () => callbackRef.current(),
            interval
        );
    }

    // Update interval if it changes
    useEffect(() => {
        spacedUpdateRef.current?.setUpdateInterval(interval);
    }, [interval]);

    return spacedUpdateRef.current;
}