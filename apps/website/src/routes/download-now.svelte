<script>
    import { getRecommendedDownload } from "$lib/download-helper";

    export let big = false;
    const { url, platform, architecture } = getRecommendedDownload();
</script>

{#if url}
    <a href="{url}"
        class:text-xl={big}
        class:py-4={big}
        class="py-2 px-5 bg-violet-600 text-white font-semibold rounded-xl shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75">
        Download now
        <span class="text-sm text-gray-300">
            ({platform} {architecture})
        </span>
    </a>
{/if}