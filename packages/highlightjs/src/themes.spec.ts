import themeDefinitions from "./themes.js";
import { describe, expect, it } from "vitest";

describe("Themes", () => {
    it("all IDs don't contain spaces", () => {
        for (const id of Object.keys(themeDefinitions)) {
            expect(id).not.toMatch(/\s/);
        }
    });
});
