/**
 * @module
 *
 * This script is used internally by the `rebuild-deps` target of the `desktop`. Normally we could use
 * `electron-rebuild` CLI directly, but it would rebuild the monorepo-level dependencies and breaks
 * the server build (and it doesn't expose a CLI option to override this).
 * 
 * A side purpose is to generate a fake `package.json` file in the `dist` directory
 * that contains only the native dependencies. This is used by `electron-forge`.
 */

import { join, resolve } from "path";
import { rebuild } from "@electron/rebuild"
import { readFileSync, rmSync, writeFileSync } from "fs";

const nativeDependencies = [
    "better-sqlite3"
];

function parsePackageJson(distDir: string) {
    const packageJsonPath = join(distDir, "../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    let electronVersion: string;

    if (process.argv[3]) {
        electronVersion = process.argv[3];
    } else {
        electronVersion = packageJson?.devDependencies?.electron ?? packageJson?.dependencies?.electron;
        if (!electronVersion) {
            console.error(`Unable to retrieve Electron version in '${resolve(packageJsonPath)}'.`);
            process.exit(3);
        }
    }
    
    return {
        electronVersion,
        packageJson
    };
}

function createFakePackageJson(distPath: string, packageJson: any) {
    const finalDependencies = {};
    for (const dep of nativeDependencies) {
        finalDependencies[dep] = packageJson.dependencies[dep];
    }

    const fakePackageJson: any = {
        name: "trilium",
        version: packageJson.version,
        main: packageJson.main,
        author: packageJson.author,
        license: packageJson.license,
        description: packageJson.description,
        dependencies: finalDependencies,
        devDependencies: {
            "electron": packageJson.devDependencies?.electron || packageJson.dependencies?.electron,
        }
    };
    if (packageJson?.config?.forge) {
        fakePackageJson.config = {
            forge: join("..", packageJson.config.forge)
        };
    }
    writeFileSync(distPath, JSON.stringify(fakePackageJson, null, 2), "utf-8");
}

function main() {
    const distDir = resolve(process.argv[2]);
    if (!distDir) {
        console.error("Missing root dir as argument.");
        process.exit(1);
    }

    const { electronVersion, packageJson } = parsePackageJson(distDir);
    const packageJsonPath = join(distDir, "package.json");
    createFakePackageJson(packageJsonPath, packageJson);

    console.log(`Rebuilding ${distDir} with version ${electronVersion}...`);

    rebuild({
        // We force the project root path to avoid electron-rebuild from rebuilding the monorepo-level dependency and breaking the server.
        projectRootPath: distDir,
        buildPath: distDir,
        force: true,
        electronVersion,
    });
}

main();
