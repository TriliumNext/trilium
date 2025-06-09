"use strict";

import chardet from "chardet";
import stripBom from "strip-bom";
import crypto from "crypto";
import { generator } from "rand-token";
import unescape from "unescape";
import escape from "escape-html";
import sanitize from "sanitize-filename";
import mimeTypes from "mime-types";
import path from "path";
import type NoteMeta from "./meta/note_meta.js";
import log from "./log.js";
import { t } from "i18next";

const randtoken = generator({ source: "crypto" });

export const isMac = process.platform === "darwin";

export const isWindows = process.platform === "win32";

export const isElectron = !!process.versions["electron"];

export const isDev = !!(process.env.TRILIUM_ENV && process.env.TRILIUM_ENV === "dev");

export function newEntityId() {
    return randomString(12);
}

export function randomString(length: number): string {
    return randtoken.generate(length);
}

export function randomSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("base64");
}

export function md5(content: crypto.BinaryLike) {
    return crypto.createHash("md5").update(content).digest("hex");
}

export function hashedBlobId(content: string | Buffer) {
    if (content === null || content === undefined) {
        content = "";
    }

    // sha512 is faster than sha256
    const base64Hash = crypto.createHash("sha512").update(content).digest("base64");

    // we don't want such + and / in the IDs
    const kindaBase62Hash = base64Hash.replaceAll("+", "X").replaceAll("/", "Y");

    // 20 characters of base62 gives us ~120 bit of entropy which is plenty enough
    return kindaBase62Hash.substr(0, 20);
}

export function toBase64(plainText: string | Buffer) {
    const buffer = (Buffer.isBuffer(plainText) ? plainText : Buffer.from(plainText));
    return buffer.toString("base64");
}

export function fromBase64(encodedText: string) {
    return Buffer.from(encodedText, "base64");
}

export function hmac(secret: any, value: any) {
    const hmac = crypto.createHmac("sha256", Buffer.from(secret.toString(), "ascii"));
    hmac.update(value.toString());
    return hmac.digest("base64");
}

export function hash(text: string) {
    text = text.normalize();

    return crypto.createHash("sha1").update(text).digest("base64");
}

export function isEmptyOrWhitespace(str: string | null | undefined) {
    if (!str) return true;
    return str.match(/^ *$/) !== null;
}

export function sanitizeSqlIdentifier(str: string) {
    return str.replace(/[^A-Za-z0-9_]/g, "");
}

export const escapeHtml = escape;

export const unescapeHtml = unescape;

export function toObject<T, K extends string | number | symbol, V>(array: T[], fn: (item: T) => [K, V]): Record<K, V> {
    const obj: Record<K, V> = {} as Record<K, V>; // TODO: unsafe?

    for (const item of array) {
        const ret = fn(item);

        obj[ret[0]] = ret[1];
    }

    return obj;
}

export function stripTags(text: string) {
    return text.replace(/<(?:.|\n)*?>/gm, "");
}

export function escapeRegExp(str: string) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export async function crash(message: string) {
    if (isElectron) {
        const electron = await import("electron");
        electron.dialog.showErrorBox(t("modals.error_title"), message);
        electron.app.exit(1);
    } else {
        log.error(message);
        process.exit(1);
    }
}

export function getContentDisposition(filename: string) {
    const sanitizedFilename = sanitize(filename).trim() || "file";
    const uriEncodedFilename = encodeURIComponent(sanitizedFilename);
    return `file; filename="${uriEncodedFilename}"; filename*=UTF-8''${uriEncodedFilename}`;
}

// render and book are string note in the sense that they are expected to contain empty string
const STRING_NOTE_TYPES = new Set(["text", "code", "relationMap", "search", "render", "book", "mermaid", "canvas"]);
const STRING_MIME_TYPES = new Set(["application/javascript", "application/x-javascript", "application/json", "application/x-sql", "image/svg+xml"]);

export function isStringNote(type: string | undefined, mime: string) {
    return (type && STRING_NOTE_TYPES.has(type)) || mime.startsWith("text/") || STRING_MIME_TYPES.has(mime);
}

export function quoteRegex(url: string) {
    return url.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
}

export function replaceAll(string: string, replaceWhat: string, replaceWith: string) {
    const quotedReplaceWhat = quoteRegex(replaceWhat);

    return string.replace(new RegExp(quotedReplaceWhat, "g"), replaceWith);
}

export function formatDownloadTitle(fileName: string, type: string | null, mime: string) {
    const fileNameBase = !fileName ? "untitled" : sanitize(fileName);

    const getExtension = () => {
        if (type === "text") return ".html";
        if (type === "relationMap" || type === "canvas" || type === "search") return ".json";
        if (!mime) return "";

        const mimeLc = mime.toLowerCase();

        // better to just return the current name without a fake extension
        // it's possible that the title still preserves the correct extension anyways
        if (mimeLc === "application/octet-stream") return "";

        // if fileName has an extension matching the mime already - reuse it
        const mimeTypeFromFileName = mimeTypes.lookup(fileName);
        if (mimeTypeFromFileName === mimeLc) return "";

        // as last resort try to get extension from mimeType
        const extensions = mimeTypes.extension(mime);
        return extensions ? `.${extensions}` : "";
    };

    return `${fileNameBase}${getExtension()}`;
}

export function removeTextFileExtension(filePath: string) {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case ".md":
        case ".mdx":
        case ".markdown":
        case ".html":
        case ".htm":
        case ".excalidraw":
        case ".mermaid":
        case ".mmd":
            return filePath.substring(0, filePath.length - extension.length);
        default:
            return filePath;
    }
}

export function getNoteTitle(filePath: string, replaceUnderscoresWithSpaces: boolean, noteMeta?: NoteMeta) {
    const trimmedNoteMeta = noteMeta?.title?.trim();
    if (trimmedNoteMeta) return trimmedNoteMeta;

    const basename = path.basename(removeTextFileExtension(filePath));
    return replaceUnderscoresWithSpaces ? basename.replace(/_/g, " ").trim() : basename;
}

export function timeLimit<T>(promise: Promise<T>, limitMs: number, errorMessage?: string): Promise<T> {
    // TriliumNextTODO: since TS avoids this from ever happening – do we need this check?
    if (!promise || !promise.then) {
        // it's not actually a promise
        return promise;
    }

    // better stack trace if created outside of promise
    const errorTimeLimit = new Error(errorMessage || `Process exceeded time limit ${limitMs}`);

    return new Promise((res, rej) => {
        let resolved = false;

        promise
            .then((result) => {
                resolved = true;

                res(result);
            })
            .catch((error) => rej(error));

        setTimeout(() => {
            if (!resolved) {
                rej(errorTimeLimit);
            }
        }, limitMs);
    });
}

export interface DeferredPromise<T> extends Promise<T> {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export function deferred<T>(): DeferredPromise<T> {
    return (() => {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;

        let promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        }) as DeferredPromise<T>;

        promise.resolve = resolve;
        promise.reject = reject;
        return promise as DeferredPromise<T>;
    })();
}

export function removeDiacritic(str: string) {
    if (!str) {
        return "";
    }
    str = str.toString();
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function normalize(str: string) {
    return removeDiacritic(str).toLowerCase();
}

export function toMap<T extends Record<string, any>>(list: T[], key: keyof T) {
    const map = new Map<string, T>();
    for (const el of list) {
        const keyForMap = el[key];
        if (!keyForMap) continue;
        // TriliumNextTODO: do we need to handle the case when the same key is used?
        // currently this will overwrite the existing entry in the map
        map.set(keyForMap, el);
    }
    return map;
}

// try to turn 'true' and 'false' strings from process.env variables into boolean values or undefined
export function envToBoolean(val: string | undefined) {
    if (val === undefined || typeof val !== "string") return undefined;

    const valLc = val.toLowerCase().trim();

    if (valLc === "true") return true;
    if (valLc === "false") return false;

    return undefined;
}

/**
 * Returns the directory for resources. On Electron builds this corresponds to the `resources` subdirectory inside the distributable package.
 * On development builds, this simply refers to the src directory of the application.
 *
 * @returns the resource dir.
 */
export function getResourceDir() {
    if (process.env.TRILIUM_RESOURCE_DIR) {
        return process.env.TRILIUM_RESOURCE_DIR;
    }

    if (isElectron && !isDev) return __dirname;
    if (!isDev) {
        return path.dirname(process.argv[1]);
    }

    return path.join(__dirname, "..");
}

// TODO: Deduplicate with src/public/app/services/utils.ts
/**
 * Compares two semantic version strings.
 * Returns:
 *   1  if v1 is greater than v2
 *   0  if v1 is equal to v2
 *   -1 if v1 is less than v2
 *
 * @param v1 First version string
 * @param v2 Second version string
 * @returns
 */
function compareVersions(v1: string, v2: string): number {
    // Remove 'v' prefix and everything after dash if present
    v1 = v1.replace(/^v/, "").split("-")[0];
    v2 = v2.replace(/^v/, "").split("-")[0];

    const v1parts = v1.split(".").map(Number);
    const v2parts = v2.split(".").map(Number);

    // Pad shorter version with zeros
    while (v1parts.length < 3) v1parts.push(0);
    while (v2parts.length < 3) v2parts.push(0);

    // Compare major version
    if (v1parts[0] !== v2parts[0]) {
        return v1parts[0] > v2parts[0] ? 1 : -1;
    }

    // Compare minor version
    if (v1parts[1] !== v2parts[1]) {
        return v1parts[1] > v2parts[1] ? 1 : -1;
    }

    // Compare patch version
    if (v1parts[2] !== v2parts[2]) {
        return v1parts[2] > v2parts[2] ? 1 : -1;
    }

    return 0;
}

/**
 * For buffers, they are scanned for a supported encoding and decoded (UTF-8, UTF-16). In some cases, the BOM is also stripped.
 *
 * For strings, they are returned immediately without any transformation.
 *
 * For nullish values, an empty string is returned.
 *
 * @param data the string or buffer to process.
 * @returns the string representation of the buffer, or the same string is it's a string.
 */
export function processStringOrBuffer(data: string | Buffer | null) {
    if (!data) {
        return "";
    }

    if (!Buffer.isBuffer(data)) {
        return data;
    }

    const detectedEncoding = chardet.detect(data);
    switch (detectedEncoding) {
        case "UTF-16LE":
            return stripBom(data.toString("utf-16le"));
        case "UTF-8":
        default:
            return data.toString("utf-8");
    }
}

export function safeExtractMessageAndStackFromError(err: unknown): [errMessage: string, errStack: string | undefined] {
    return (err instanceof Error) ? [err.message, err.stack] as const : ["Unknown Error", undefined] as const;
}


export default {
    compareVersions,
    crash,
    deferred,
    envToBoolean,
    escapeHtml,
    escapeRegExp,
    formatDownloadTitle,
    fromBase64,
    getContentDisposition,
    getNoteTitle,
    getResourceDir,
    hash,
    hashedBlobId,
    hmac,
    isDev,
    isElectron,
    isEmptyOrWhitespace,
    isMac,
    isStringNote,
    isWindows,
    md5,
    newEntityId,
    normalize,
    quoteRegex,
    randomSecureToken,
    randomString,
    removeDiacritic,
    removeTextFileExtension,
    replaceAll,
    safeExtractMessageAndStackFromError,
    sanitizeSqlIdentifier,
    stripTags,
    timeLimit,
    toBase64,
    toMap,
    toObject,
    unescapeHtml
};
