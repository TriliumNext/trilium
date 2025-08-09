import { ComponentChildren } from "preact";
import Icon from "./Icon";
import { CSSProperties } from "preact/compat";

interface FormListOpts {
    children: ComponentChildren;
    onSelect?: (value: string) => void;
    style?: CSSProperties;
}

export default function FormList({ children, onSelect, style }: FormListOpts) {
    return (
        <div class="dropdown-menu static show" style={{
            ...style ?? {},
            position: "relative",
        }} onClick={(e) => {
            const value = (e.target as HTMLElement)?.dataset?.value;
            if (value && onSelect) {
                onSelect(value);
            }
        }}>
            {children}
        </div>
    );
}

interface FormListItemOpts {
    children: ComponentChildren;
    icon?: string;
    value?: string;
    title?: string;
}

export function FormListItem({ children, icon, value, title }: FormListItemOpts) {
    return (
        <a class="dropdown-item" data-value={value} title={title}>
            <Icon icon={icon} />&nbsp;
            {children}
        </a>
    );
}

interface FormListHeaderOpts {
    text: string;
}

export function FormListHeader({ text }: FormListHeaderOpts) {
    return (
        <li>
            <h6 className="dropdown-header">{text}</h6>
        </li>
    )
}
