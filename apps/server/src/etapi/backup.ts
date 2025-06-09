import type { Router } from "express";

import eu from "./etapi_utils.js";
import backupService from "../services/backup.js";

function register(router: Router) {
    eu.route(router, "put", "/etapi/backup/:backupName", (req, res, next) => {
        backupService.backupNow(req.params.backupName)
            .then(() => res.sendStatus(204))
            .catch(() => res.sendStatus(500));
    });
}

export default {
    register
};
