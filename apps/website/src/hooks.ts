import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute = (request: {
    url: URL;
    fetch: typeof fetch;
}) => deLocalizeUrl(request.url).pathname;
