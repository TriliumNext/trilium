import { assetUrlFragment } from "../services/asset_path.js";
import path from "path";
import express from "express";
import { getResourceDir, isDev } from "../services/utils.js";
import type serveStatic from "serve-static";
import proxy from "express-http-proxy";
import { existsSync } from "fs";

const persistentCacheStatic = (root: string, options?: serveStatic.ServeStaticOptions<express.Response<unknown, Record<string, unknown>>>) => {
    if (!isDev) {
        options = {
            maxAge: "1y",
            ...options
        };
    }
    return express.static(root, options);
};

async function register(app: express.Application) {
    const srcRoot = path.join(__dirname, "..");
    const resourceDir = getResourceDir();

    if (isDev) {
        const publicUrl = process.env.TRILIUM_PUBLIC_SERVER;
        if (!publicUrl) {
            throw new Error("Missing TRILIUM_PUBLIC_SERVER");
        }
        app.use("/" + assetUrlFragment + `/@fs`, proxy(publicUrl, {
            proxyReqPathResolver: (req) => "/" + assetUrlFragment + `/@fs` + req.url
        }));
    } else {
        const publicDir = path.join(resourceDir, "public");
        if (!existsSync(publicDir)) {
            throw new Error("Public directory is missing at: " + path.resolve(publicDir));
        }

        app.use(`/${assetUrlFragment}/src`, persistentCacheStatic(path.join(publicDir, "src")));
        app.use(`/${assetUrlFragment}/stylesheets`, persistentCacheStatic(path.join(publicDir, "stylesheets")));
        app.use(`/${assetUrlFragment}/fonts`, persistentCacheStatic(path.join(publicDir, "fonts")));
        app.use(`/${assetUrlFragment}/translations/`, persistentCacheStatic(path.join(publicDir, "translations")));
        app.use(`/node_modules/`, persistentCacheStatic(path.join(publicDir, "node_modules")));
    }
    app.use(`/${assetUrlFragment}/images`, persistentCacheStatic(path.join(resourceDir, "assets", "images")));
    app.use(`/${assetUrlFragment}/doc_notes`, persistentCacheStatic(path.join(resourceDir, "assets", "doc_notes")));
    app.use(`/assets/vX/fonts`, express.static(path.join(srcRoot, "public/fonts")));
    app.use(`/assets/vX/images`, express.static(path.join(srcRoot, "..", "images")));
    app.use(`/assets/vX/stylesheets`, express.static(path.join(srcRoot, "public/stylesheets")));
}

export default {
    register
};
