/// <reference types='vitest' />
import { join, resolve } from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import asset_path from './src/asset_path';
import webpackStatsPlugin from 'rollup-plugin-webpack-stats';

const assets = [ "assets", "stylesheets", "libraries", "fonts", "translations" ];

export default defineConfig(() => ({
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/client',
    base: process.env.NODE_ENV === "production" ? "" : asset_path,
    server: {
        port: 4200,
        host: 'localhost',
    },
    preview: {
        port: 4300,
        host: 'localhost',
    },
    plugins: [
        viteStaticCopy({
            targets: assets.map((asset) => ({
                src: `src/${asset}/*`,
                dest: asset
            }))
        }),
        viteStaticCopy({
            structured: true,
            targets: [
                {
                    src: "node_modules/@excalidraw/excalidraw/dist/prod/fonts/*",
                    dest: "",
                }
            ]
        }),
        webpackStatsPlugin()
    ],
    resolve: {
        alias: [
            // Force the use of dist in development mode because upstream ESM is broken (some hybrid between CJS and ESM, will be improved in upcoming versions).
            {
                find: "@triliumnext/highlightjs",
                replacement: resolve(__dirname, "node_modules/@triliumnext/highlightjs/dist")
            }
        ]
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
        target: "esnext",
        outDir: './dist',
        emptyOutDir: true,
        reportCompressedSize: true,
        sourcemap: process.env.NODE_ENV === "production",
        rollupOptions: {
            input: {
                desktop: join(__dirname, "src", "desktop.ts"),
                mobile: join(__dirname, "src", "mobile.ts"),
                login: join(__dirname, "src", "login.ts"),
                setup: join(__dirname, "src", "setup.ts"),
                share: join(__dirname, "src", "share.ts"),
                set_password: join(__dirname, "src", "set_password.ts"),
                runtime: join(__dirname, "src", "runtime.ts")
            },
            output: {
                entryFileNames: "src/[name].js",
                chunkFileNames: "src/[name].js",
                assetFileNames: "src/[name].[ext]"
            },
            onwarn(warning, rollupWarn) {
                if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
                    return;
                }
                rollupWarn(warning);
            }
        }
    },
    optimizeDeps: {
        exclude: [
            "@triliumnext/highlightjs"
        ]
    },
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true
            }
        }
    },
    commonjsOptions: {
        transformMixedEsModules: true,
    }
}));
