import { ComponentChildren } from "preact";
import AbstractBulkAction from "./abstract_bulk_action";

interface BulkActionProps {
    label: string | ComponentChildren;   
    children?: ComponentChildren;
    helpText?: ComponentChildren;
    bulkAction: AbstractBulkAction;
}

export default function BulkAction({ label, children, helpText, bulkAction }: BulkActionProps) {
    return (
        <tr>
            <td colSpan={2}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ marginRight: "10px" }} className="text-nowrap">{label}</div>

                    {children}
                </div>
            </td>
            <td className="button-column">
                {helpText && <div className="dropdown help-dropdown">
                    <span className="bx bx-help-circle icon-action" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></span>
                    <div className="dropdown-menu dropdown-menu-right p-4">
                        {helpText}
                    </div>
                </div>}

                <span
                    className="bx bx-x icon-action action-conf-del"
                    onClick={() => bulkAction?.deleteAction()}
                />
            </td>
        </tr>
    );
}

export function BulkActionText({ text }: { text: string }) {
    return (
        <div
            style={{ marginRight: "10px", marginLeft: "10px" }}
            className="text-nowrap">
                {text}
            </div>
    );
}