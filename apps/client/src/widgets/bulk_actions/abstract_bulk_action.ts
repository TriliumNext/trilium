import server from "../../services/server.js";
import ws from "../../services/ws.js";
import type FAttribute from "../../entities/fattribute.js";
import { VNode } from "preact";

export interface ActionDefinition {
    script: string;
    relationName: string;
    targetNoteId: string;
    targetParentNoteId: string;
    oldRelationName?: string;
    newRelationName?: string;
    newTitle?: string;
    labelName?: string;
    labelValue?: string;
    oldLabelName?: string;
    newLabelName?: string;
}

export default abstract class AbstractBulkAction {
    attribute: FAttribute;
    actionDef: ActionDefinition;

    constructor(attribute: FAttribute, actionDef: ActionDefinition) {
        this.attribute = attribute;
        this.actionDef = actionDef;
    }

    // to be overridden
    abstract doRender(): VNode;

    static get actionName() {
        return "";
    }

    async saveAction(data: {}) {
        const actionObject = Object.assign({ name: (this.constructor as typeof AbstractBulkAction).actionName }, data);

        await server.put(`notes/${this.attribute.noteId}/attribute`, {
            attributeId: this.attribute.attributeId,
            type: "label",
            name: "action",
            value: JSON.stringify(actionObject)
        });

        await ws.waitForMaxKnownEntityChangeId();
    }

    async deleteAction() {
        await server.remove(`notes/${this.attribute.noteId}/attributes/${this.attribute.attributeId}`);
        await ws.waitForMaxKnownEntityChangeId();
    }
}
