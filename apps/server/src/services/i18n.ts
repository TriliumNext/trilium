import i18next from "i18next";
import options from "./options.js";
import sql_init from "./sql_init.js";
import { join } from "path";
import { getResourceDir } from "./utils.js";
import hidden_subtree from "./hidden_subtree.js";
import { LOCALES, type Locale, type LOCALE_IDS } from "@triliumnext/commons";
import dayjs, { Dayjs } from "dayjs";

const DAYJS_LOADER: Record<LOCALE_IDS, () => Promise<typeof import("dayjs/locale/en.js")>> = {
    "ar": () => import("dayjs/locale/ar.js"),
    "cn": () => import("dayjs/locale/zh-cn.js"),
    "de": () => import("dayjs/locale/de.js"),
    "en": () => import("dayjs/locale/en.js"),
    "es": () => import("dayjs/locale/es.js"),
    "fa": () => import("dayjs/locale/fa.js"),
    "fr": () => import("dayjs/locale/fr.js"),
    "he": () => import("dayjs/locale/he.js"),
    "ku": () => import("dayjs/locale/ku.js"),
    "ro": () => import("dayjs/locale/ro.js"),
    "tw": () => import("dayjs/locale/zh-tw.js")
}

export async function initializeTranslations() {
    const resourceDir = getResourceDir();
    const Backend = (await import("i18next-fs-backend/cjs")).default;
    const locale = getCurrentLanguage();

    // Initialize translations
    await i18next.use(Backend).init({
        lng: locale,
        fallbackLng: "en",
        ns: "server",
        backend: {
            loadPath: join(resourceDir, "assets/translations/{{lng}}/{{ns}}.json")
        }
    });

    // Initialize dayjs locale.
    const dayjsLocale = await DAYJS_LOADER[locale]();
    dayjs.locale(dayjsLocale);
}

export function ordinal(date: Dayjs) {
    return dayjs(date)
        .format("Do");
}

export function getLocales(): Locale[] {
    return LOCALES;
}

function getCurrentLanguage(): LOCALE_IDS {
    let language: string | null = null;
    if (sql_init.isDbInitialized()) {
        language = options.getOptionOrNull("locale");
    }

    if (!language) {
        console.info("Language option not found, falling back to en.");
        language = "en";
    }

    return language as LOCALE_IDS;
}

export async function changeLanguage(locale: string) {
    await i18next.changeLanguage(locale);
    hidden_subtree.checkHiddenSubtree(true, { restoreNames: true });
}
