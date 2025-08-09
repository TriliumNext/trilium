import { CSSProperties } from "preact/compat";

type HTMLElementLike = string | HTMLElement | JQuery<HTMLElement>;

interface RawHtmlProps {
    className?: string;
    html: HTMLElementLike;
    style?: CSSProperties;
}

export default function RawHtml(props: RawHtmlProps) {
    return <span {...getProps(props)} />;
}

export function RawHtmlBlock(props: RawHtmlProps) {
    return <div {...getProps(props)} />
}

function getProps({ className, html, style }: RawHtmlProps) {
    return {
        className: className,
        dangerouslySetInnerHTML: getHtml(html),
        style
    }
}

function getHtml(html: string | HTMLElement | JQuery<HTMLElement>) {
    if (typeof html === "object" && "length" in html) {
        html = html[0];
    }

    if (typeof html === "object" && "outerHTML" in html) {
        html = html.outerHTML;
    }

    return {
        __html: html as string
    };
}