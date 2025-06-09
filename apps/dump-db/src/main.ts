import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dumpService from "./inc/dump.js";

yargs(hideBin(process.argv))
    .command(
        "$0 <path_to_document> <target_directory>",
        "dump the contents of document.db into the target directory",
        (yargs) => {
            return yargs
                .option("path_to_document", { alias: "p", describe: "path to the document.db", type: "string", demandOption: true })
                .option("target_directory", { alias: "t", describe: "path of the directory into which the notes should be dumped", type: "string", demandOption: true });
        },
        (argv) => {
            try {
                dumpService.dumpDocument(argv.path_to_document, argv.target_directory, {
                    includeDeleted: argv.includeDeleted,
                    password: argv.password
                });
            } catch (e) {
                console.error(`Unrecoverable error:`, e);
                process.exit(1);
            }
        }
    )
    .option("password", {
        type: "string",
        description: "Set password to be able to decrypt protected notes."
    })
    .option("include-deleted", {
        type: "boolean",
        default: false,
        description: "If set to true, dump also deleted notes."
    })
    .parse();
