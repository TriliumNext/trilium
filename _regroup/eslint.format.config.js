import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// eslint config just for formatting rules
// potentially to be merged with the linting rules into one single config,
// once we have fixed the majority of lint errors

// Go to https://eslint.style/rules/default/${rule_without_prefix} to check the rule details
export const stylisticRules = {
    "@stylistic/indent": [ "error", 4 ],
    "@stylistic/quotes": [ "error", "double", { avoidEscape: true, allowTemplateLiterals: "always" } ],
    "@stylistic/semi": [ "error", "always" ],
    "@stylistic/quote-props": [ "error", "consistent-as-needed" ],
    "@stylistic/max-len": [ "error", { code: 100 } ],
    "@stylistic/comma-dangle": [ "error", "never" ],
    "@stylistic/linebreak-style": [ "error", "unix" ],
    "@stylistic/array-bracket-spacing": [ "error", "always" ],
    "@stylistic/object-curly-spacing": [ "error", "always" ],
    "@stylistic/padded-blocks": [ "error", { classes: "always" } ]
};

export default [
    {
        files: [ "**/*.{js,ts,mjs,cjs}" ],
        languageOptions: {
            parser: tsParser
        },
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            ...stylisticRules
        }
    },
    {
        ignores: [
            "build/*",
            "dist/*",
            "docs/*",
            "demo/*",
            // TriliumNextTODO: check if we want to format packages here as well - for now skipping it
            "packages/*",
            "src/public/app-dist/*",
            "src/public/app/doc_notes/*"
        ]
    }
];
