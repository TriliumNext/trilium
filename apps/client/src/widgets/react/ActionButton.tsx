interface ActionButtonProps {
    text: string;
    icon: string;
    onClick?: () => void;
}

export default function ActionButton({ text, icon, onClick }: ActionButtonProps) {
    return <button
        class={`icon-action ${icon}`}
        title={text}
        onClick={onClick}
    />;
}