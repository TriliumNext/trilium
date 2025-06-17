import server from "../services/server";
import Component from "./component";

// TODO: Deduplicate.
interface CpuArchResponse {
    isCpuArchMismatch: boolean;
}

export class StartupChecks extends Component {

    constructor() {
        super();
        this.checkCpuArchMismatch();
    }

    async checkCpuArchMismatch() {
        try {
            const response = await server.get("system-checks") as CpuArchResponse;
            if (response.isCpuArchMismatch) {
                this.triggerCommand("showCpuArchWarning", {});
            }
        } catch (error) {
            console.warn("Could not check CPU arch status:", error);
        }
    }
}
