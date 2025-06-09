export interface Locale {
    id: string;
    name: string;
    /** `true` if the language is a right-to-left one, or `false` if it's left-to-right. */
    rtl?: boolean;
    /** `true` if the language is not supported by the application as a display language, but it is selectable by the user for the content. */
    contentOnly?: boolean;
    /** The value to pass to `--lang` for the Electron instance in order to set it as a locale. Not setting it will hide it from the list of supported locales. */
    electronLocale?: string;
}

const UNSORTED_LOCALES = [
    {
        id: "en",
        name: "English",
        electronLocale: "en"
    },
    {
        id: "de",
        name: "Deutsch",
        electronLocale: "de"
    },
    {
        id: "es",
        name: "Español",
        electronLocale: "es"
    },
    {
        id: "fr",
        name: "Français",
        electronLocale: "fr"
    },
    {
        id: "cn",
        name: "简体中文",
        electronLocale: "zh_CN"
    },
    {
        id: "tw",
        name: "繁體中文",
        electronLocale: "zh_TW"
    },
    {
        id: "ro",
        name: "Română",
        electronLocale: "ro"
    },

    /*
     * Right to left languages
     *
     * Currently they are only for setting the language of text notes.
     */
    { // Arabic
        id: "ar",
        name: "اَلْعَرَبِيَّةُ",
        rtl: true,
        contentOnly: true
    },
    { // Hebrew
        id: "he",
        name: "עברית",
        rtl: true,
        contentOnly: true
    },
    { // Kurdish
        id: "ku",
        name: "کوردی",
        rtl: true,
        contentOnly: true
    },
    { // Persian
        id: "fa",
        name: "فارسی",
        rtl: true,
        contentOnly: true
    }
] as const;

export const LOCALES: Locale[] = Array.from(UNSORTED_LOCALES)
    .sort((a, b) => a.name.localeCompare(b.name));

export type LOCALE_IDS = typeof UNSORTED_LOCALES[number]["id"];
