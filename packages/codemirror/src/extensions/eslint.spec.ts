import { lint as _lint } from "./eslint.js";
import { trimIndentation } from "@triliumnext/commons";
import { describe, expect, it } from "vitest";

async function lint(code: string, mimeType: string) {
    const linterData = await _lint(mimeType);
    if (!("linter" in linterData)) {
        return [];
    }
    const { linter, config } = linterData;
    const result = linter.verify(code, config);
    return result;
}

describe("Linter", () => {
    it("reports some basic errors", async () => {
        const result = await lint(trimIndentation`
            for (const i = 0; i<10; i++) {
            }
        `, "application/javascript;env=frontend");
        expect(result).toMatchObject([
            { message: "'i' is constant.", },
            { message: "Empty block statement." }
        ]);
    });

    it("reports no error for correct script", async () => {
        const result = await lint(trimIndentation`
            const foo = "bar";
            console.log(foo.toString());
            for (const x of [ 1, 2, 3]) {
                console.log(x?.toString());
            }

            api.showMessage("Hi");
        `, "application/javascript;env=frontend");
        expect(result.length).toBe(0);
    });

    it("reports unused functions as warnings", async () => {
        const result = await lint(trimIndentation`
            function hello() { }
            function world() { }

            console.log("Hello world");
        `, "application/javascript;env=frontend");
        expect(result).toMatchObject([
            {
                message: "'hello' is defined but never used.",
                severity: 1
            },
            {
                message: "'world' is defined but never used.",
                severity: 1
            }
        ]);
    });

    it("supports JQuery global", async () => {
        expect(await lint(`$("<div>");`, "application/javascript;env=backend")).toMatchObject([{ "ruleId": "no-undef" }]);
        expect(await lint(`console.log($("<div>"));`, "application/javascript;env=frontend")).toStrictEqual([]);
    });

    it("supports module.exports", async () => {
        expect(await lint(`module.exports("Hi");`, "application/javascript;env=backend")).toStrictEqual([]);
        expect(await lint(`module.exports("Hi");`, "application/javascript;env=frontend")).toStrictEqual([]);
    });

    it("ignores TypeScript file", async () => {
        expect(await lint("export async function lint(code: string, mimeType: string) {}", "text/typescript-jsx")).toStrictEqual([]);
    });
});
