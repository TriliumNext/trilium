import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { createNote, login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

const USER = "etapi";
let createdBranchId: string;

describe("etapi/attachment-content", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);

        // Create a note and a branch.
        const response = await supertest(app)
            .post("/etapi/create-note")
            .auth("etapi", token, { "type": "basic"})
            .send({
                "parentNoteId": "root",
                "title": "Hello",
                "type": "text",
                "content": "",
            })
            .expect(201);

        createdBranchId = response.body.branch.branchId;
    });

    it("can patch branch info", async () => {
        const state = {
            prefix: "pref",
            notePosition: 666,
            isExpanded: true
        };

        await supertest(app)
            .patch(`/etapi/branches/${createdBranchId}`)
            .auth("etapi", token, { "type": "basic"})
            .send(state)
            .expect(200);

        const response = await supertest(app)
            .get(`/etapi/branches/${createdBranchId}`)
            .auth("etapi", token, { "type": "basic"})
            .expect(200);
        expect(response.body).toMatchObject(state);
    });

    it("rejects not allowed property", async () => {
        const response = await supertest(app)
            .patch(`/etapi/branches/${createdBranchId}`)
            .auth("etapi", token, { "type": "basic"})
            .send({
                parentNoteId: "root"
            })
            .expect(400);
        expect(response.body.code).toStrictEqual("PROPERTY_NOT_ALLOWED");
    });

    it("rejects invalid property value", async () => {
        const response = await supertest(app)
            .patch(`/etapi/branches/${createdBranchId}`)
            .auth("etapi", token, { "type": "basic"})
            .send({
                prefix: 123
            })
            .expect(400);
        expect(response.body.code).toStrictEqual("PROPERTY_VALIDATION_ERROR");
    });

});
