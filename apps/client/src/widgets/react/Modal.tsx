import { useEffect, useRef } from "preact/hooks";
import { t } from "../../services/i18n";
import { ComponentChildren } from "preact";
import type { CSSProperties, RefObject } from "preact/compat";

interface ModalProps {
    className: string;
    title: string | ComponentChildren;
    size: "xl" | "lg" | "md" | "sm";
    children: ComponentChildren;
    /**
     * Items to display in the modal header, apart from the title itself which is handled separately.
     */
    header?: ComponentChildren;
    footer?: ComponentChildren;
    footerStyle?: CSSProperties;
    footerAlignment?: "right" | "between";
    minWidth?: string;
    maxWidth?: number;
    zIndex?: number;
    /**
     * If true, the modal body will be scrollable if the content overflows.
     * This is useful for larger modals where you want to keep the header and footer visible
     * while allowing the body content to scroll.
     * Defaults to false.
     */
    scrollable?: boolean;
    /**
     * If set, the modal body and footer will be wrapped in a form and the submit event will call this function.
     * Especially useful for user input that can be submitted with Enter key.
     */
    onSubmit?: () => void;
    /** Called when the modal is shown. */
    onShown?: () => void;
    /** Called when the modal is hidden, either via close button, backdrop click or submit. */
    onHidden?: () => void;
    helpPageId?: string;
    /**
     * Gives access to the underlying modal element. This is useful for manipulating the modal directly
     * or for attaching event listeners.
     */
    modalRef?: RefObject<HTMLDivElement>;
    /**
     * Gives access to the underlying form element of the modal. This is only set if `onSubmit` is provided.
     */
    formRef?: RefObject<HTMLFormElement>;
    bodyStyle?: CSSProperties;
}

export default function Modal({ children, className, size, title, header, footer, footerStyle, footerAlignment, onShown, onSubmit, helpPageId, minWidth, maxWidth, zIndex, scrollable, onHidden: onHidden, modalRef: _modalRef, formRef: _formRef, bodyStyle }: ModalProps) {
    const modalRef = _modalRef ?? useRef<HTMLDivElement>(null);
    const formRef = _formRef ?? useRef<HTMLFormElement>(null);

    if (onShown || onHidden) {
        useEffect(() => {
            const modalElement = modalRef.current;
            if (!modalElement) {
                return;
            }
            if (onShown) {
                modalElement.addEventListener("shown.bs.modal", onShown);
            }
            if (onHidden) {
                modalElement.addEventListener("hidden.bs.modal", onHidden);
            }
            return () => {
                if (onShown) {
                    modalElement.removeEventListener("shown.bs.modal", onShown);
                }
                if (onHidden) {
                    modalElement.removeEventListener("hidden.bs.modal", onHidden);
                }
            };
        }, [ ]);
    }    

    const dialogStyle: CSSProperties = {};
    if (zIndex) {
        dialogStyle.zIndex = zIndex;
    }

    const documentStyle: CSSProperties = {};
    if (maxWidth) {
        documentStyle.maxWidth = `${maxWidth}px`;
    }
    if (minWidth) {
        documentStyle.minWidth = minWidth;
    }

    return (
        <div className={`modal fade mx-auto ${className}`} tabIndex={-1} style={dialogStyle} role="dialog" ref={modalRef}>
            <div className={`modal-dialog modal-${size} ${scrollable ? "modal-dialog-scrollable" : ""}`} style={documentStyle} role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        {!title || typeof title === "string" ? (
                            <h5 className="modal-title">{title ?? <>&nbsp;</>}</h5>
                        ) : (
                            title
                        )}
                        {header}
                        {helpPageId && (
                            <button className="help-button" type="button" data-in-app-help={helpPageId} title={t("modal.help_title")}>?</button>
                        )}
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label={t("modal.close")}></button>
                    </div>

                    {onSubmit ? (
                        <form ref={formRef} onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}>
                            <ModalInner footer={footer} bodyStyle={bodyStyle} footerStyle={footerStyle} footerAlignment={footerAlignment}>{children}</ModalInner>
                        </form>
                    ) : (
                        <ModalInner footer={footer} bodyStyle={bodyStyle} footerStyle={footerStyle} footerAlignment={footerAlignment}>
                            {children}
                        </ModalInner>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalInner({ children, footer, footerAlignment, bodyStyle, footerStyle: _footerStyle }: Pick<ModalProps, "children" | "footer" | "footerAlignment" | "bodyStyle" | "footerStyle">) {
    const footerStyle: CSSProperties = _footerStyle ?? {};
    if (footerAlignment === "between") {
        footerStyle.justifyContent = "space-between";
    }

    return (
        <>
            <div className="modal-body" style={bodyStyle}>
                {children}
            </div>

            {footer && (
                <div className="modal-footer" style={footerStyle}>
                    {footer}
                </div>
            )}
        </>
    );
}