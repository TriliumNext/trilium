import setupToC from "./modules/toc";
import setupExpanders from "./modules/expanders";
import setupMobileMenu from "./modules/mobile";
import setupSearch from "./modules/search";
import setupThemeSelector from "./modules/theme";

function $try<T extends (...a: unknown[]) => unknown>(func: T, ...args: Parameters<T>) {
    try {
        func.apply(func, args);
    }
    catch (e) {
        console.error(e); // eslint-disable-line no-console
    }
}

$try(setupThemeSelector);
$try(setupToC);
$try(setupExpanders);
$try(setupMobileMenu);
$try(setupSearch);
