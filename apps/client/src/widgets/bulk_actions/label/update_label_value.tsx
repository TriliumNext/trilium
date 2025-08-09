import { t } from "../../../services/i18n.js";
import AbstractBulkAction, { ActionDefinition } from "../abstract_bulk_action.js";
import FormTextBox from "../../react/FormTextBox.jsx";
import BulkAction, { BulkActionText } from "../BulkAction.jsx";
import { useSpacedUpdate } from "../../react/hooks.jsx";
import { useEffect, useState } from "preact/hooks";

function UpdateLabelValueComponent({ bulkAction, actionDef }: { bulkAction: AbstractBulkAction, actionDef: ActionDefinition}) {
    const [ labelName, setLabelName ] = useState<string>(actionDef.labelName ?? "");
    const [ labelValue, setLabelValue ] = useState<string>(actionDef.labelValue ?? "");
    const spacedUpdate = useSpacedUpdate(() => bulkAction.saveAction({ labelName, labelValue }));
    useEffect(() => spacedUpdate.scheduleUpdate(), [labelName, labelValue]);

    return (
        <BulkAction
            bulkAction={bulkAction}
            label={t("update_label_value.update_label_value")}
            helpText={<>
                <p>${t("update_label_value.help_text")}</p>

                ${t("update_label_value.help_text_note")}
            </>}
        >
            <FormTextBox
                placeholder={t("update_label_value.label_name_placeholder")}
                pattern="[\\p{L}\\p{N}_:]+"
                title={t("update_label_value.label_name_title")}
                currentValue={labelName} onChange={setLabelName}
            />
            <BulkActionText text={t("update_label_value.to_value")} />
            <FormTextBox
                placeholder={t("update_label_value.new_value_placeholder")}
                currentValue={labelValue} onChange={setLabelValue}
            />
        </BulkAction>
    )
}

export default class UpdateLabelValueBulkAction extends AbstractBulkAction {
    static get actionName() {
        return "updateLabelValue";
    }
    static get actionTitle() {
        return t("update_label_value.update_label_value");
    }

    doRender() {
        return <UpdateLabelValueComponent bulkAction={this} actionDef={this.actionDef} />;
    }
}
