import { useEffect, useState } from "preact/hooks";
import { t } from "../../../services/i18n";
import FormTextBox from "../../react/FormTextBox";
import AbstractBulkAction, { ActionDefinition } from "../abstract_bulk_action";
import BulkAction, { BulkActionText } from "../BulkAction";
import { useSpacedUpdate } from "../../react/hooks";

function AddLabelBulkActionComponent({ bulkAction, actionDef }: { bulkAction: AbstractBulkAction, actionDef: ActionDefinition }) {
    const [ labelName, setLabelName ] = useState<string>(actionDef.labelName ?? "");
    const [ labelValue, setLabelValue ] = useState<string>(actionDef.labelValue ?? "");
    const spacedUpdate = useSpacedUpdate(() => bulkAction.saveAction({ labelName, labelValue }));
    useEffect(() => spacedUpdate.scheduleUpdate(), [labelName, labelValue]);

    return (
        <BulkAction
            bulkAction={bulkAction}
            label={t("add_label.add_label")}
            helpText={<>
                <p>{t("add_label.help_text")}</p>

                <ul>
                    <li>{t("add_label.help_text_item1")}</li>
                    <li>{t("add_label.help_text_item2")}</li>
                </ul>

                {t("add_label.help_text_note")}
            </>}
        >
            <FormTextBox
                placeholder={t("add_label.label_name_placeholder")}
                pattern="[\\p{L}\\p{N}_:]+"
                title={t("add_label.label_name_title")}
                currentValue={labelName} onChange={setLabelName}
            />
            <BulkActionText text={t("add_label.to_value")} />
            <FormTextBox
                placeholder={t("add_label.new_value_placeholder")}
                currentValue={labelValue} onChange={setLabelValue}
            />
        </BulkAction>
    )
}

export default class AddLabelBulkAction extends AbstractBulkAction {

    doRender() {
        return <AddLabelBulkActionComponent bulkAction={this} actionDef={this.actionDef} />;
    }

    static get actionName() {
        return "addLabel";
    }

    static get actionTitle() {
        return t("add_label.add_label");
    }
}
