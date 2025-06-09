const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = function (filePath) {
    const { WINDOWS_SIGN_EXECUTABLE } = process.env;

    if (!WINDOWS_SIGN_EXECUTABLE) {
        console.warn("[Sign] Skip signing due to missing environment variable.");
        return;
    }

    const outputDir = path.join(__dirname, "sign");
    console.log("Output dir is ", path.resolve(outputDir));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const command = `${WINDOWS_SIGN_EXECUTABLE} --executable "${filePath}"`;
    console.log(`[Sign] Running ${command}`);

    try {
      child_process.execSync(command);
    } catch (e) {
      console.warn(`[Sign] Unable to sign ${filePath} due to:\n${e.stdout.toString("utf-8")})}`)
      return;
    }

    console.log(`[Sign] Signed ${filePath} successfully.`);
}