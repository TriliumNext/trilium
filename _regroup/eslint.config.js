import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    // consider using rules below, once we have a full TS codebase and can be more strict
    // tseslint.configs.strictTypeChecked,
    // tseslint.configs.stylisticTypeChecked,
    // tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        plugins: {
            "simple-import-sort": simpleImportSort
        }
    },
    {
        rules: {
            // add rule overrides here
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_"
                }
            ],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error"
        }
    },
    {
        ignores: [
            "build/*",
            "dist/*",
            "docs/*",
            "demo/*",
            "src/public/app-dist/*",
            "src/public/app/doc_notes/*"
        ]
    }
);
