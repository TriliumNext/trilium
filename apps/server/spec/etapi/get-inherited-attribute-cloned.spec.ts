import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { createNote, login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

let parentNoteId: string;

describe("etapi/get-inherited-attribute-cloned", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);

        parentNoteId = await createNote(app, token);
    });

    it("gets inherited attribute", async () => {
        // Create an inheritable attribute on the parent note.
        let response = await supertest(app)
            .post("/etapi/attributes")
            .auth("etapi", token, { "type": "basic"})
            .send({
                "noteId": parentNoteId,
                "type": "label",
                "name": "mylabel",
                "value": "val",
                "isInheritable": true,
                "position": 10
            })
            .expect(201);
        const parentAttributeId = response.body.attributeId;
        expect(parentAttributeId).toBeTruthy();

        // Create a subnote.
        response = await supertest(app)
            .post("/etapi/create-note")
            .auth("etapi", token, { "type": "basic"})
            .send({
                "parentNoteId": parentNoteId,
                "title": "Hello",
                "type": "text",
                "content": "Hi there!"
            })
            .expect(201);
        const childNoteId = response.body.note.noteId;

        // Create child attribute
        response = await supertest(app)
            .post("/etapi/attributes")
            .auth("etapi", token, { "type": "basic"})
            .send({
                "noteId": childNoteId,
                "type": "label",
                "name": "mylabel",
                "value": "val",
                "isInheritable": false,
                "position": 10
            })
            .expect(201);
        const childAttributeId = response.body.attributeId;
        expect(parentAttributeId).toBeTruthy();

        // Clone child to parent
        response = await supertest(app)
            .post("/etapi/branches")
            .auth("etapi", token, { "type": "basic"})
            .send({
                noteId: childNoteId,
                parentNoteId: parentNoteId
            })
            .expect(200);
        parentNoteId = response.body.parentNoteId;

        // Check attribute IDs
        response = await supertest(app)
            .get(`/etapi/notes/${childNoteId}`)
            .auth("etapi", token, { "type": "basic"})
            .expect(200);
        expect(response.body.noteId).toStrictEqual(childNoteId);
        expect(response.body.attributes).toHaveLength(2);
        expect(hasAttribute(response.body.attributes, parentAttributeId));
        expect(hasAttribute(response.body.attributes, childAttributeId));
    });

    function hasAttribute(list: object[], attributeId: string) {
        for (let i = 0; i < list.length; i++) {
                if (list[i]["attributeId"] === attributeId) {
                return true;
            }
        }
        return false;
    }
});
