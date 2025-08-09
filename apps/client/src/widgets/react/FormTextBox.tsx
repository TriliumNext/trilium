import { InputHTMLAttributes, RefObject } from "preact/compat";

interface FormTextBoxProps extends Pick<InputHTMLAttributes<HTMLInputElement>, "placeholder" | "autoComplete" | "className" | "type" | "name" | "pattern" | "title" | "style"> {
    id?: string;
    currentValue?: string;
    onChange?(newValue: string): void;
    inputRef?: RefObject<HTMLInputElement>;
}

export default function FormTextBox({ id, type, name, className, currentValue, onChange, autoComplete, inputRef, placeholder, title, pattern, style }: FormTextBoxProps) {
    return (
        <input
            ref={inputRef}
            type={type ?? "text"}
            className={`form-control ${className ?? ""}`}
            id={id}
            name={name}
            value={currentValue}
            autoComplete={autoComplete}
            placeholder={placeholder}
            title={title}
            pattern={pattern}
            onInput={e => onChange?.(e.currentTarget.value)}
            style={style}
        />
    );
}