import rootPackageJson from '../../../../package.json';

export type App = "desktop" | "server";

export type Architecture = 'x64' | 'arm64';

export type Platform = "macos" | "windows" | "linux" | "pikapod";

const version = rootPackageJson.version;

export interface DownloadInfo {
    recommended?: boolean;
    name: string;
    url?: string;
}

export interface DownloadMatrixEntry {
    title: Record<Architecture, string> | string;
    description: Record<Architecture, string> | string;
    downloads: Record<string, DownloadInfo>;
}

type DownloadMatrix = Record<App, { [ P in Platform ]?: DownloadMatrixEntry }>;

// Keep compatibility info inline with https://github.com/electron/electron/blob/main/README.md#platform-support.
export const downloadMatrix: DownloadMatrix = {
    desktop: {
        windows: {
            title: {
                x64: "Windows 64-bit",
                arm64: "Windows on ARM"
            },
            description: {
                x64: "Compatible with Intel or AMD devices running Windows 10 and 11.",
                arm64: "Compatible with ARM devices (e.g. with Qualcomm Snapdragon).",
            },
            downloads: {
                exe: {
                    recommended: true,
                    name: "Download Installer (.exe)"
                },
                zip: {
                    name: "Portable (.zip)"
                },
                scoop: {
                    name: "Scoop",
                    url: "https://scoop.sh/#/apps?q=triliumnext"
                },
                winget: {
                    name: "Winget",
                    url: "https://github.com/microsoft/winget-pkgs/tree/master/manifests/t/TriliumNext/Notes/"
                }
            }
        },
        linux: {
            title: {
                x64: "Linux 64-bit",
                arm64: "Linux on ARM"
            },
            description: {
                x64: "For most Linux distributions, compatible with x86_64 architecture.",
                arm64: "For ARM-based Linux distributions, compatible with aarch64 architecture.",
            },
            downloads: {
                deb: {
                    recommended: true,
                    name: "Download .deb"
                },
                rpm: {
                    name: ".rpm"
                },
                flatpak: {
                    name: ".flatpak"
                },
                zip: {
                    name: "Portable (.zip)"
                },
                nixpkgs: {
                    name: "nixpkgs",
                    url: "https://search.nixos.org/packages?query=trilium-next"
                },
                aur: {
                    name: "AUR",
                    url: "https://aur.archlinux.org/packages/triliumnext-bin"
                }
            }
        },
        macos: {
            title: {
                x64: "macOS for Intel",
                arm64: "macOS for Apple Silicon"
            },
            description: {
                x64: "For Intel-based Macs running macOS Big Sur or later.",
                arm64: "For Apple Silicon Macs such as those with M1 and M2 chips.",
            },
            downloads: {
                dmg: {
                    recommended: true,
                    name: "Download Installer (.dmg)"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        }
    },
    server: {
        linux: {
            title: "Self-hosted (Linux)",
            description: "Deploy Trilium Notes on your own server or VPS, compatible with most Linux distributions.",
            downloads: {
                docker: {
                    recommended: true,
                    name: "View on Docker Hub",
                    url: "https://hub.docker.com/r/triliumnext/notes"
                },
                tarX64: {
                    name: "x86 (.tar.xz)",
                    url: `https://github.com/TriliumNext/Notes/releases/download/v${version}/TriliumNextNotes-Server-v${version}-linux-x64.tar.xz`
                },
                tarArm64: {
                    name: "ARM (.tar.xz)",
                    url: `https://github.com/TriliumNext/Notes/releases/download/v${version}/TriliumNextNotes-Server-v${version}-linux-arm64.tar.xz`
                },
                nixos: {
                    name: "NixOS module",
                    url: "https://search.nixos.org/options?query=trilium-server"
                }
            }
        },
        pikapod: {
            title: "Paid hosting",
            description: "Trilium Notes hosted on PikaPods, a paid service for easy access and management.",
            downloads: {
                pikapod: {
                    recommended: true,
                    name: "Set up on PikaPods",
                    url: "https://www.pikapods.com/pods?run=trilium-next"
                },
                triliumcc: {
                    name: "Alternatively see trilium.cc",
                    url: "https://trilium.cc/"
                }
            }
        }
    }
};

export function buildDownloadUrl(app: App, platform: Platform, format: string, architecture: Architecture): string {
    if (app === "desktop") {
        return downloadMatrix.desktop[platform]?.downloads[format].url ??
            `https://github.com/TriliumNext/Notes/releases/download/v${version}/TriliumNextNotes-v${version}-${platform}-${architecture}.${format}`;
    } else if (app === "server") {
        return downloadMatrix.server[platform]?.downloads[format].url ?? "#";
    } else {
        return "#";
    }
}

export function getArchitecture(): Architecture {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        return 'arm64';
    }

    return "x64";
}

function getPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
        return "macos";
    } else if (userAgent.includes('windows') || userAgent.includes('win32')) {
        return "windows";
    } else {
        return "linux";
    }
}

export function getRecommendedDownload() {
    const architecture = getArchitecture();
    const platform = getPlatform();

    const downloadInfo = downloadMatrix.desktop[platform]?.downloads;
    const recommendedDownload = Object.entries(downloadInfo || {}).find(d => d[1].recommended);
    const format = recommendedDownload?.[0];
    const url = buildDownloadUrl("desktop", platform, format || 'zip', architecture);

    return {
        architecture,
        platform,
        url
    }
}
