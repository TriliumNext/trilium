import { Application } from "express";
import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login } from "./utils.js";
import config from "../../src/services/config.js";
import type TestAgent from "supertest/lib/agent.js";

let app: Application;

const USER = "etapi";

const routes = [
    "GET /etapi/notes?search=aaa",
    "GET /etapi/notes/root",
    "PATCH /etapi/notes/root",
    "DELETE /etapi/notes/root",
    "GET /etapi/branches/root",
    "PATCH /etapi/branches/root",
    "DELETE /etapi/branches/root",
    "GET /etapi/attributes/000",
    "PATCH /etapi/attributes/000",
    "DELETE /etapi/attributes/000",
    "GET /etapi/inbox/2022-02-22",
    "GET /etapi/calendar/days/2022-02-22",
    "GET /etapi/calendar/weeks/2022-02-22",
    "GET /etapi/calendar/months/2022-02",
    "GET /etapi/calendar/years/2022",
    "POST /etapi/create-note",
    "GET /etapi/app-info",
]

describe("no-token", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
    });

    for (const route of routes) {
        const [ method, url ] = route.split(" ", 2);

        it(`rejects access to ${method} ${url}`, () => {
            (supertest(app)[method.toLowerCase()](url) as TestAgent)
                .auth(USER, "fakeauth", { "type": "basic"})
                .expect(401)
        });
    }

    it("responds with 404 even without token", () => {
        supertest(app)
            .get("/etapi/zzzzzz")
            .expect(404);
    });
});
