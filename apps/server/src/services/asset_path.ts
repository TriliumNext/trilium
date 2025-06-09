import packageJson from "../../package.json" with { type: "json" };
import { isDev } from "./utils";

export const assetUrlFragment = `assets/v${packageJson.version}`;
const assetPath = isDev ? `http://localhost:4200/${assetUrlFragment}` : assetUrlFragment;

export default assetPath;
