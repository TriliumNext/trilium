import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login } from "./utils.js";
import config from "../../src/services/config.js";

let app: Application;
let token: string;

const USER = "etapi";
const URL = "/etapi/notes/root";

describe("basic-auth", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);
    });

    it("auth token works", async () => {
        const response = await supertest(app)
            .get(URL)
            .auth(USER, token, { "type": "basic"})
            .expect(200);
    });

    it("rejects wrong password", async () => {
        const response = await supertest(app)
            .get(URL)
            .auth(USER, "wrong", { "type": "basic"})
            .expect(401);
    });

    it("rejects wrong user", async () => {
        const response = await supertest(app)
            .get(URL)
            .auth("wrong", token, { "type": "basic"})
            .expect(401);
    });

    it("logs out", async () => {
        await supertest(app)
            .post("/etapi/auth/logout")
            .auth(USER, token, { "type": "basic"})
            .expect(204);

        // Ensure we can't access it anymore
        await supertest(app)
            .get("/etapi/notes/root")
            .auth(USER, token, { "type": "basic"})
            .expect(401);
    });
});
