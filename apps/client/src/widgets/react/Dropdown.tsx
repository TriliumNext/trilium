import { Dropdown as BootstrapDropdown } from "bootstrap";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

interface DropdownProps {
    className?: string;
    isStatic?: boolean;
    children: ComponentChildren;
}

export default function Dropdown({ className, isStatic, children }: DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>();
    const triggerRef = useRef<HTMLButtonElement>();

    if (triggerRef?.current) {
        useEffect(() => {
            const dropdown = BootstrapDropdown.getOrCreateInstance(triggerRef.current!);
            return () => dropdown.dispose();
        });
    }

    if (dropdownRef?.current) {
        useEffect(() => {
            $(dropdownRef.current!).on("hide.bs.dropdown", () => {
                console.log("Hide");
            });
        });
    }

    return (
        <div ref={dropdownRef} class="dropdown" style={{ display: "flex" }}>
            <button
                ref={triggerRef}
                type="button"
                style={{ display: "none" }}
                data-bs-toggle="dropdown"
                data-bs-display={ isStatic ? "static" : undefined } />

            <div class={`dropdown-menu ${className ?? ""} ${isStatic ? "static" : undefined}`}>
                {children}
            </div>
        </div>
    )
}