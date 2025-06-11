export function copyText(text: string) {
    if (!text) {
        return;
    }
    try {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback method: https://stackoverflow.com/a/72239825
            const textArea = document.createElement("textarea");
            textArea.value = text;
            try {
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                return document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (e) {
        console.warn(e);
        return false;
    }
}

export async function copyTextWithToast(text: string) {
    const t = (await import("./i18n.js")).t;
    const toast = (await import("./toast.js")).default;

    if (copyText(text)) {
        toast.showMessage(t("clipboard.copy_success"));
    } else {
        toast.showError(t("clipboard.copy_failed"));
    }
}
