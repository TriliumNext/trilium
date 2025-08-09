import { describe, it, expect } from "vitest";
import { processMindmapContent } from "./note_content_fulltext.js";
import NoteContentFulltextExp from "./note_content_fulltext.js";

describe("processMindmapContent", () => {
    it("supports empty JSON", () => {
        expect(processMindmapContent("{}")).toEqual("");
    });

    it("supports blank text / invalid JSON", () => {
        expect(processMindmapContent("")).toEqual("");
        expect(processMindmapContent(`{ "node": " }`)).toEqual("");
    });
});

describe("Fuzzy Search Operators", () => {
    it("~= operator works with typos", () => {
        // Test that the ~= operator can handle common typos
        const expression = new NoteContentFulltextExp("~=", { tokens: ["hello"] });
        expect(expression.tokens).toEqual(["hello"]);
        expect(() => new NoteContentFulltextExp("~=", { tokens: ["he"] })).toThrow(); // Too short
    });

    it("~* operator works with fuzzy contains", () => {
        // Test that the ~* operator handles fuzzy substring matching
        const expression = new NoteContentFulltextExp("~*", { tokens: ["world"] });
        expect(expression.tokens).toEqual(["world"]);
        expect(() => new NoteContentFulltextExp("~*", { tokens: ["wo"] })).toThrow(); // Too short
    });
});
