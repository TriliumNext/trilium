<script lang="ts">
    import { buildDownloadUrl, type Architecture, type DownloadMatrixEntry, type Platform, type App } from "$lib/download-helper";

    export let app: App = "desktop";
    export let platformId: Platform;
    export let platform: DownloadMatrixEntry;
    export let textColor: string;
    export let bgColor: string;
    export let hoverColor: string;
    export let architecture: Architecture | null = null;
    const recommended = Object.entries(platform.downloads).find((e) => e[1].recommended);
</script>

<div class="bg-white dark:bg-gray-900 border border-gray-200 rounded-2xl shadow-lg p-8 flex flex-col items-start">
    <h3 class="text-2xl font-semibold {textColor} mb-2">{typeof platform.title === "object" ? platform.title[architecture] : platform.title}</h3>
    <p class="text-gray-700 dark:text-gray-200 mb-12">{typeof platform.title === "object" ? platform.description[architecture] : platform.description}</p>                
    <div class="space-y-2 mt-auto w-full">
        {#if recommended}
            <a href={buildDownloadUrl(app, platformId as Platform, recommended[0], architecture)} class="mt-auto block text-center {bgColor} {hoverColor} text-white font-medium py-2 px-5 rounded-full shadow transition">
                {recommended[1].name}
            </a>
        {/if}
        <div class="flex flex-wrap justify-center gap-4 text-sm {textColor} mt-2">
            {#each Object.entries(platform.downloads).filter((e) => !e[1].recommended) as [format, download]}
                <a href={buildDownloadUrl(app, platformId as Platform, format, architecture)} class="hover:underline block">
                    {download.name}
                </a>
            {/each}
        </div>
    </div>
</div>