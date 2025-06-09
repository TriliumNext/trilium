import supertest from "supertest";
import options from "./options";
import cls from "./cls";
import { Application } from "express";
import config from "./config";
import { refreshAuth } from "./auth";

let app: Application;

describe("Auth", () => {
    beforeAll(async () => {
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
    });

    describe("Auth", () => {
        beforeAll(() => {
            config.General.noAuthentication = false;
            refreshAuth();
        });

        it("goes to login and asks for TOTP if enabled", async () => {
            cls.init(() => {
                options.setOption("mfaEnabled", "true");
                options.setOption("mfaMethod", "totp");
                options.setOption("totpVerificationHash", "hi");
            });
            const response = await supertest(app)
                .get("/")
                .redirects(1)
                .expect(200);
            expect(response.text).toContain(`id="totpToken"`);
        });

        it("goes to login and doesn't ask for TOTP is disabled", async () => {
            cls.init(() => {
                options.setOption("mfaEnabled", "false");
            });
            const response = await supertest(app)
                .get("/")
                .redirects(1)
                .expect(200)
            expect(response.text).not.toContain(`id="totpToken"`);
        });
    });

    describe("No auth", () => {
        beforeAll(() => {
            config.General.noAuthentication = true;
            refreshAuth();
        });

        it("doesn't ask for authentication when disabled, even if TOTP is enabled", async () => {
            cls.init(() => {
                options.setOption("mfaEnabled", "true");
                options.setOption("mfaMethod", "totp");
                options.setOption("totpVerificationHash", "hi");
            });
            await supertest(app)
                .get("/")
                .expect(200);
        });

        it("doesn't ask for authentication when disabled, with TOTP disabled", async () => {
            cls.init(() => {
                options.setOption("mfaEnabled", "false");
            });
            await supertest(app)
                .get("/")
                .expect(200);
        });
    });
}, 60_000);
