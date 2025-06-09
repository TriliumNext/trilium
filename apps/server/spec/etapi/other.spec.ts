import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

const USER = "etapi";

describe("etapi/refresh-note-ordering/root", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);
    });

    it("refreshes note ordering", async () => {
        await supertest(app)
            .post("/etapi/refresh-note-ordering/root")
            .auth(USER, token, { "type": "basic"})
            .expect(204);
    });
});
