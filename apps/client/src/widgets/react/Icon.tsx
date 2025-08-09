interface IconProps {
    icon?: string;
}

export default function Icon({ icon }: IconProps) {
    return <span class={icon ?? "bx bx-empty"}></span>
}