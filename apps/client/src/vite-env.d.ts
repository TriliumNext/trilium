/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    /** The license key for CKEditor premium features. */
    readonly VITE_CKEDITOR_KEY?: string;
    /** Whether to enable the CKEditor inspector (see https://ckeditor.com/docs/ckeditor5/latest/framework/develpment-tools/inspector.html). */
    readonly VITE_CKEDITOR_ENABLE_INSPECTOR?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
