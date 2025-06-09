import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { createNote, login } from "./utils.js";
import config from "../../src/services/config.js";
import { randomUUID } from "crypto";

let app: Application;
let token: string;

const USER = "etapi";
let content: string;

describe("etapi/search", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);

        content = randomUUID();
        await createNote(app, token, content);
    });

    it("finds by content", async () => {
        const response = await supertest(app)
            .get(`/etapi/notes?search=${content}&debug=true`)
            .auth(USER, token, { "type": "basic"})
            .expect(200);
        expect(response.body.results).toHaveLength(1);
    });

    it("does not find by content when fast search is on", async () => {
        const response = await supertest(app)
            .get(`/etapi/notes?search=${content}&debug=true&fastSearch=true`)
            .auth(USER, token, { "type": "basic"})
            .expect(200);
        expect(response.body.results).toHaveLength(0);
    });
});
