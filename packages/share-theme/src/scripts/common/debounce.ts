export default function debounce<T extends (...args: unknown[]) => unknown>(executor: T, delay: number) {
    let timeout: NodeJS.Timeout | null;
    return function(...args: Parameters<T>): void {
        const callback = () => {
            timeout = null;
            Reflect.apply(executor, null, args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(callback, delay);
    };
}