import { describe, expect, it } from "vitest";
import { parseNavigationStateFromUrl } from "./link.js";

describe("Link", () => {
    it("parses plain searchString", () => {
        const output = parseNavigationStateFromUrl("http://localhost:8080/#?searchString=hello");
        expect(output).toMatchObject({ searchString: "hello" });
    });

    it("parses searchString with hash", () => {
        const output = parseNavigationStateFromUrl("https://github.com/orgs/TriliumNext/discussions/1526#discussioncomment-12656660");
        expect(output).toStrictEqual({});
    });

    it("parses notePath", () => {
        const output = parseNavigationStateFromUrl(`#root/WWaBNf3SSA1b/mQ2tIzLVFKHL`);
        expect(output).toMatchObject({ notePath: "root/WWaBNf3SSA1b/mQ2tIzLVFKHL", noteId: "mQ2tIzLVFKHL" });
    });

    it("parses notePath with spaces", () => {
        const output = parseNavigationStateFromUrl(`  #root/WWaBNf3SSA1b/mQ2tIzLVFKHL`);
        expect(output).toMatchObject({ notePath: "root/WWaBNf3SSA1b/mQ2tIzLVFKHL", noteId: "mQ2tIzLVFKHL" });
    });

    it("parses notePath with extraWindow", () => {
        const output = parseNavigationStateFromUrl(`127.0.0.1:8080/?extraWindow=1#root/QZGqKB7wVZF8?ntxId=0XPvXG`);
        expect(output).toMatchObject({ notePath: "root/QZGqKB7wVZF8", noteId: "QZGqKB7wVZF8" });
    });

    it("ignores external URL with internal hash anchor", () => {
        const output = parseNavigationStateFromUrl(`https://en.wikipedia.org/wiki/Bearded_Collie#Health`);
        expect(output).toMatchObject({});
    });

    it("ignores malformed but hash-containing external URL", () => {
        const output = parseNavigationStateFromUrl("https://abc.com/#drop?searchString=firefox");
        expect(output).toStrictEqual({});
    });

    it("ignores non-hash internal path", () => {
        const output = parseNavigationStateFromUrl("/root/abc123");
        expect(output).toStrictEqual({});
    });
});
