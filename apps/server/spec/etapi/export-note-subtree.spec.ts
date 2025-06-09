import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

const USER = "etapi";

describe("etapi/export-note-subtree", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);
    });

    it("export works", async () => {
        await supertest(app)
            .get("/etapi/notes/root/export")
            .auth(USER, token, { "type": "basic"})
            .expect(200)
            .expect("Content-Type", "application/zip");
    });

    it("HTML export works", async () => {
        await supertest(app)
            .get("/etapi/notes/root/export?format=html")
            .auth(USER, token, { "type": "basic"})
            .expect(200)
            .expect("Content-Type", "application/zip");
    });

    it("Markdown export works", async () => {
        await supertest(app)
            .get("/etapi/notes/root/export?format=markdown")
            .auth(USER, token, { "type": "basic"})
            .expect(200)
            .expect("Content-Type", "application/zip");
    });

    it("reports wrong format", async () => {
        const response = await supertest(app)
            .get("/etapi/notes/root/export?format=wrong")
            .auth(USER, token, { "type": "basic"})
            .expect(400);
        expect(response.body.code).toStrictEqual("UNRECOGNIZED_EXPORT_FORMAT");
    });
});
