import fs from "fs";
import http from "http";
import https from "https";
import tmp from "tmp";
import config from "./services/config.js";
import log from "./services/log.js";
import appInfo from "./services/app_info.js";
import ws from "./services/ws.js";
import utils from "./services/utils.js";
import port from "./services/port.js";
import host from "./services/host.js";
import buildApp from "./app.js";
import type { Express } from "express";

const MINIMUM_NODE_VERSION = "20.0.0";

export default async function startTriliumServer() {
    // setup basic error handling even before requiring dependencies, since those can produce errors as well
    process.on("unhandledRejection", (error: Error) => {
        // this makes sure that stacktrace of failed promise is printed out
        console.log(error);

        // but also try to log it into file
        log.info(error);
    });

    function exit() {
        console.log("Caught interrupt/termination signal. Exiting.");
        process.exit(0);
    }

    process.on("SIGINT", exit);
    process.on("SIGTERM", exit);

    if (utils.compareVersions(process.versions.node, MINIMUM_NODE_VERSION) < 0) {
        console.error();
        console.error(`The Trilium server requires Node.js ${MINIMUM_NODE_VERSION} and later in order to start.\n`);
        console.error(`\tCurrent version:\t${process.versions.node}`);
        console.error(`\tExpected version:\t${MINIMUM_NODE_VERSION}`);
        console.error();
        process.exit(1);
    }

    tmp.setGracefulCleanup();

    const app = await buildApp();

    /**
     * The intended behavior is to detect when a second instance is running, in that case open the old instance
     * instead of the new one. This is complicated by the fact that it is possible to run multiple instances of Trilium
     * if port and data dir are configured separately. This complication is the source of the following weird usage.
     *
     * The line below makes sure that the "second-instance" (process in window.ts) is fired. Normally it returns a boolean
     * indicating whether another instance is running or not, but we ignore that and kill the app only based on the port conflict.
     *
     * A bit weird is that "second-instance" is triggered also on the valid usecases (different port/data dir) and
     * focuses the existing window. But the new process is start as well and will steal the focus too, it will win, because
     * its startup is slower than focusing the existing process/window. So in the end, it works out without having
     * to do a complex evaluation.
     */
    if (utils.isElectron) {
        (await import("electron")).app.requestSingleInstanceLock();
    }

    log.info(JSON.stringify(appInfo, null, 2));

    // for perf. issues it's good to know the rough configuration
    const cpuInfos = (await import("os")).cpus();
    if (cpuInfos && cpuInfos[0] !== undefined) {
        // https://github.com/zadam/trilium/pull/3957
        const cpuModel = (cpuInfos[0].model || "").trimEnd();
        log.info(`CPU model: ${cpuModel}, logical cores: ${cpuInfos.length}, freq: ${cpuInfos[0].speed} Mhz`);
    }

    const httpServer = startHttpServer(app);

    const sessionParser = (await import("./routes/session_parser.js")).default;
    ws.init(httpServer, sessionParser as any); // TODO: Not sure why session parser is incompatible.

    if (utils.isElectron) {
        const electronRouting = await import("./routes/electron.js");
        electronRouting.default(app);
    }
}

function startHttpServer(app: Express) {
    app.set("port", port);
    app.set("host", host);

    // Check from config whether to trust reverse proxies to supply user IPs, hostnames and protocols
    if (config["Network"]["trustedReverseProxy"]) {
        if (config["Network"]["trustedReverseProxy"] === true || config["Network"]["trustedReverseProxy"].trim().length) {
            app.set("trust proxy", config["Network"]["trustedReverseProxy"]);
        }
    }

    log.info(`Trusted reverse proxy: ${app.get("trust proxy")}`);

    let httpServer: http.Server | https.Server;

    if (config["Network"]["https"]) {
        if (!config["Network"]["keyPath"] || !config["Network"]["keyPath"].trim().length) {
            throw new Error("keyPath in config.ini is required when https=true, but it's empty");
        }

        if (!config["Network"]["certPath"] || !config["Network"]["certPath"].trim().length) {
            throw new Error("certPath in config.ini is required when https=true, but it's empty");
        }

        const options = {
            key: fs.readFileSync(config["Network"]["keyPath"]),
            cert: fs.readFileSync(config["Network"]["certPath"])
        };

        httpServer = https.createServer(options, app);

        log.info(`App HTTPS server starting up at port ${port}`);
    } else {
        httpServer = http.createServer(app);

        log.info(`App HTTP server starting up at port ${port}`);
    }

    /**
     * Listen on provided port, on all network interfaces.
     */

    httpServer.keepAliveTimeout = 120000 * 5;
    const listenOnTcp = port !== 0;

    if (listenOnTcp) {
        httpServer.listen(port, host); // TCP socket.
    } else {
        httpServer.listen(host); // Unix socket.
    }

    httpServer.on("error", (error) => {
        let message = error.stack || "An unexpected error has occurred.";

        // handle specific listen errors with friendly messages
        if ("code" in error) {
            switch (error.code) {
                case "EACCES":
                    message = `Port ${port} requires elevated privileges. It's recommended to use port above 1024.`;
                    break;
                case "EADDRINUSE":
                    message = `Port ${port} is already in use. Most likely, another Trilium process is already running. You might try to find it, kill it, and try again.`;
                    break;
                case "EADDRNOTAVAIL":
                    message = `Unable to start the server on host '${host}'. Make sure the host (defined in 'config.ini' or via the 'TRILIUM_HOST' environment variable) is an IP address that can be listened on.`;
                    break;
            }
        }

        if (utils.isElectron) {
            import("electron").then(({ app, dialog }) => {
                // Not all situations require showing an error dialog. When Trilium is already open,
                // clicking the shortcut, the software icon, or the taskbar icon, or when creating a new window,
                // should simply focus on the existing window or open a new one, without displaying an error message.
                if ("code" in error && error.code == "EADDRINUSE") {
                    if (process.argv.includes("--new-window") || !app.requestSingleInstanceLock()) {
                        console.error(message);
                        process.exit(1);
                    }
                }
                dialog.showErrorBox("Error while initializing the server", message);
                process.exit(1);
            });
        } else {
            console.error(message);
            process.exit(1);
        }
    });

    httpServer.on("listening", () => {
        if (listenOnTcp) {
            log.info(`Listening on port ${port}`);
        } else {
            log.info(`Listening on unix socket ${host}`);
        }
    });

    return httpServer;
}
