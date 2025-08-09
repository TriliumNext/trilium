import { Tooltip } from "bootstrap";
import { useEffect, useRef } from "preact/compat";
import { escapeQuotes } from "../../services/utils";
import { ComponentChildren } from "preact";

interface FormCheckboxProps {
    name: string;
    label: string | ComponentChildren;
    /**
     * If set, the checkbox label will be underlined and dotted, indicating a hint. When hovered, it will show the hint text.
     */
    hint?: string;
    currentValue: boolean;
    disabled?: boolean;
    onChange(newValue: boolean): void;
}

export default function FormCheckbox({ name, disabled, label, currentValue, onChange, hint }: FormCheckboxProps) {
    const labelRef = useRef<HTMLLabelElement>(null);

    if (hint) {
        useEffect(() => {
            let tooltipInstance: Tooltip | null = null;
            if (labelRef.current) {
                tooltipInstance = Tooltip.getOrCreateInstance(labelRef.current, {
                    html: true,
                    template: '<div class="tooltip tooltip-top" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
                });
            }
            return () => tooltipInstance?.dispose();
        }, [labelRef.current]);
    }

    return (
        <div className="form-checkbox">
            <label
                className="form-check-label tn-checkbox"
                style={hint && { textDecoration: "underline dotted var(--main-text-color)" }}
                title={hint && escapeQuotes(hint)}
                ref={labelRef}
            >
                <input
                    className="form-check-input"
                    type="checkbox"
                    name={name}
                    checked={currentValue || false}
                    value="1"
                    disabled={disabled}
                    onChange={e => onChange((e.target as HTMLInputElement).checked)} />
                {label}
            </label>
        </div>
    );
}