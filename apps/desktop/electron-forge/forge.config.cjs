const path = require("path");
const fs = require("fs-extra");
const { LOCALES } = require("@triliumnext/commons");

const ELECTRON_FORGE_DIR = __dirname;

const EXECUTABLE_NAME = "trilium"; // keep in sync with server's package.json -> packagerConfig.executableName
const PRODUCT_NAME = "TriliumNext Notes";
const APP_ICON_PATH = path.join(ELECTRON_FORGE_DIR, "app-icon");

const extraResourcesForPlatform = getExtraResourcesForPlatform();
const baseLinuxMakerConfigOptions = {
  name: EXECUTABLE_NAME,
  bin: EXECUTABLE_NAME,
  productName: PRODUCT_NAME,
  icon: path.join(APP_ICON_PATH, "png/128x128.png"),
  desktopTemplate: path.resolve(path.join(ELECTRON_FORGE_DIR, "desktop.ejs")),
  categories: ["Office", "Utility"]
};
const windowsSignConfiguration = process.env.WINDOWS_SIGN_EXECUTABLE ? {
    hookModulePath: path.join(ELECTRON_FORGE_DIR, "sign-windows.cjs")
} : undefined;
const macosSignConfiguration = process.env.APPLE_ID ? {
    osxSign: {},
    osxNotarize: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID
    }
} : undefined;

module.exports = {
    outDir: "out",
    // Documentation of `packagerConfig` options: https://electron.github.io/packager/main/interfaces/Options.html
    packagerConfig: {
        executableName: EXECUTABLE_NAME,
        name: PRODUCT_NAME,
        overwrite: true,
        asar: true,
        icon: path.join(APP_ICON_PATH, "icon"),
        ...macosSignConfiguration,
        windowsSign: windowsSignConfiguration,
        extraResource: [
            // All resources should stay in Resources directory for macOS
            ...(process.platform === "darwin" ? [] : extraResourcesForPlatform)
        ],
        prune: false,
        afterComplete: [
            (buildPath, _electronVersion, platform, _arch, callback) => {
                // Only move resources on non-macOS platforms
                if (platform !== "darwin") {
                    for (const resource of extraResourcesForPlatform) {
                        const baseName = path.basename(resource);
                        const sourcePath = path.join(buildPath, "resources", baseName);

                        // prettier-ignore
                        const destPath = (baseName !== "256x256.png")
                            ? path.join(buildPath, baseName)
                            : path.join(buildPath, "icon.png");

                        fs.move(sourcePath, destPath)
                            .then(() => callback())
                            .catch((err) => callback(err));
                    }
                } else {
                    callback();
                }
            }
        ]
    },
    rebuildConfig: {
        force: true,
        extraModules: [ "better-sqlite3" ]
    },
    makers: [
        {
            name: "@electron-forge/maker-deb",
            config: {
                options: baseLinuxMakerConfigOptions
            }
        },
        {
            name: "@electron-forge/maker-flatpak",
            config: {
                options: {
                    ...baseLinuxMakerConfigOptions,
                    id: "com.triliumnext.notes",
                    runtimeVersion: "24.08",
                    base: "org.electronjs.Electron2.BaseApp",
                    baseVersion: "24.08",
                    baseFlatpakref: "https://flathub.org/repo/flathub.flatpakrepo",
                    modules: [
                        {
                            name: "zypak",
                            sources: {
                                type: "git",
                                url: "https://github.com/refi64/zypak",
                                tag: "v2024.01.17"
                            }
                        }
                    ]
                },
            }
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {
                options: baseLinuxMakerConfigOptions
            }
        },
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: EXECUTABLE_NAME,
                productName: PRODUCT_NAME,
                iconUrl: "https://raw.githubusercontent.com/TriliumNext/Notes/develop/images/app-icons/icon.ico",
                setupIcon: path.join(ELECTRON_FORGE_DIR, "setup-icon/setup.ico"),
                loadingGif: path.join(ELECTRON_FORGE_DIR, "setup-icon/setup-banner.gif"),
                windowsSign: windowsSignConfiguration
            }
        },
        {
            name: "@electron-forge/maker-dmg",
            config: {
                icon: path.join(APP_ICON_PATH, "icon.icns")
            }
        },
        {
            name: "@electron-forge/maker-zip",
            config: {
                options: {
                    iconUrl: "https://raw.githubusercontent.com/TriliumNext/Notes/develop/images/app-icons/icon.ico",
                    icon: path.join(APP_ICON_PATH, "icon.ico")
                }
            }
        }
    ],
    plugins: [
        {
            name: "@electron-forge/plugin-auto-unpack-natives",
            config: {}
        }
    ],
    hooks: {
        // Remove unused locales from the packaged app to save some space.
        postPackage(_, packageResult) {
            const localesToKeep = LOCALES
                .filter(locale => !locale.contentOnly)
                .map(locale => locale.electronLocale.replace("_", "-"));

            for (const outputPath of packageResult.outputPaths) {
                const localesDir = path.join(outputPath, 'locales');

                if (!fs.existsSync(localesDir)) {
                    console.log('No locales directory found. Skipping cleanup.');
                    return;
                }

                const files = fs.readdirSync(localesDir);

                for (const file of files) {
                    const localeName = path.basename(file, ".pak");
                    if (localesToKeep.includes(localeName)) {
                        continue;
                    }

                    console.log(`Removing unused locale file: ${file}`);                    
                    const filePath = path.join(localesDir, file);
                    fs.unlinkSync(filePath);
                }
            }
        },
        // Gather all the artifacts produced by the makers and copy them to a common upload directory.
        postMake(_, makeResults) {
            const outputDir = path.join(__dirname, "..", "upload");
            fs.mkdirpSync(outputDir);
            for (const makeResult of makeResults) {
                for (const artifactPath of makeResult.artifacts) {
                    // Ignore certain artifacts.
                    let fileName = path.basename(artifactPath);
                    const extension = path.extname(fileName);
                    if (fileName === "RELEASES" || extension === ".nupkg") {
                        continue;
                    }

                    // Override the extension for the CI.
                    const { TRILIUM_ARTIFACT_NAME_HINT } = process.env;
                    if (TRILIUM_ARTIFACT_NAME_HINT) {
                        fileName = TRILIUM_ARTIFACT_NAME_HINT.replaceAll("/", "-") + extension;
                    }
        
                    const outputPath = path.join(outputDir, fileName);
                    console.log(`[Artifact] ${artifactPath} -> ${outputPath}`);
                    fs.copyFileSync(artifactPath, outputPath);
                }
            }
        }
    }
};

function getExtraResourcesForPlatform() {
    const resources = [];

    const getScriptResources = () => {
        const scripts = ["trilium-portable", "trilium-safe-mode", "trilium-no-cert-check"];
        const scriptExt = (process.platform === "win32") ? "bat" : "sh";
        return scripts.map(script => `electron-forge/${script}.${scriptExt}`);
    }

    switch (process.platform) {
        case "win32":
            resources.push(...getScriptResources())
            break;
        case "linux":
            resources.push(...getScriptResources(), path.join(APP_ICON_PATH, "png/256x256.png"));
            break;
        default:
            break;
    }

    return resources;
}
