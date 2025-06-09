import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { createNote, login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

let parentNoteId: string;

describe("etapi/get-inherited-attribute", () => {
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
                "isInheritable": true
            })
            .expect(201);
        const createdAttributeId = response.body.attributeId;
        expect(createdAttributeId).toBeTruthy();

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
        const createdNoteId = response.body.note.noteId;

        // Check the attribute is inherited.
        response = await supertest(app)
            .get(`/etapi/notes/${createdNoteId}`)
            .auth("etapi", token, { "type": "basic"})
            .expect(200);
        expect(response.body.noteId).toStrictEqual(createdNoteId);
        expect(response.body.attributes).toHaveLength(1);
        expect(response.body.attributes[0].attributeId === createdAttributeId);
    });
});
