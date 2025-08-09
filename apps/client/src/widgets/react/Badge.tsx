interface BadgeProps {
    className?: string;
    title: string;
}

export default function Badge({ title, className }: BadgeProps) {
    return <span class={`badge ${className ?? ""}`}>{title}</span>
}