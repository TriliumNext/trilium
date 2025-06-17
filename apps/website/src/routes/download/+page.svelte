<script lang="ts">
    import type { Platform } from "$lib/download-helper";
    import { downloadMatrix, getArchitecture } from "$lib/download-helper";
    import DownloadCard from "./download-card.svelte";

    let architectures = ["x64", "arm64"] as const;
    let architecture = getArchitecture();
</script>

<svelte:head>
    <title>Trilium Notes: Download</title>
    <!-- TODO: description?
    	<meta name="description" content="This is where the description goes for search engines" />
    -->
</svelte:head>

<div class="bg-gray-50 dark:bg-black py-20">
    <section class="max-w-6xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">Download the desktop application</h2>
    
        <!-- Architecture pill selector -->
        <div class="col-span-3 flex justify-center items-center gap-3 mb-6">
            <span class="text-gray-600 dark:text-gray-300 font-medium mr-2">Architecture:</span>
            <div class="inline-flex bg-violet-100 rounded-full shadow p-1">
                {#each architectures as arch}            
                    <button class="py-2 px-6 rounded-full font-semibold focus:outline-none transition
                        text-violet-700 border-violet-700
                        aria-pressed:bg-violet-700 aria-pressed:text-violet-100
                        " aria-pressed={architecture === arch} on:click={() => architecture = arch}>
                        {arch}
                    </button>
                {/each}
            </div>
        </div>
    
        <div class="grid md:grid-cols-3 gap-10">
            {#each Object.entries(downloadMatrix.desktop) as [platformId, platform]}
                {@const textColor = (platformId === "windows" ? "text-blue-600" : platformId === "linux" ? "text-violet-600" : "text-gray-800 dark:text-gray-100")}
                {@const bgColor = (platformId === "windows" ? "bg-blue-600" : platformId === "linux" ? "bg-violet-600" : "bg-gray-800")}
                {@const hoverColor = (platformId === "windows" ? "hover:bg-blue-700" : platformId === "linux" ? "hover:bg-violet-700" : "hover:bg-gray-900")}
                <DownloadCard app="desktop"
                    {textColor} {bgColor} {hoverColor}
                    {platform} {architecture} platformId={platformId as Platform} />
            {/each}
        </div>
    </section>

    <section class="max-w-4xl mx-auto px-4 mt-10">
        <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">Set up a server for access on multiple devices</h2>

        <div class="grid md:grid-cols-2 gap-10">
            {#each Object.entries(downloadMatrix.server) as [platformId, platform]}
                {@const textColor = (platformId === "linux" ? "text-violet-600" : "text-gray-800 dark:text-gray-100")}
                {@const bgColor = (platformId === "linux" ? "bg-violet-600" : "bg-gray-800")}
                {@const hoverColor = (platformId === "linux" ? "hover:bg-violet-700" : "hover:bg-gray-900")}
                <DownloadCard app="server"
                    {textColor} {bgColor} {hoverColor}
                    {platform} {architecture} platformId={platformId as Platform} />
            {/each}
        </div>
    </section>

    <!-- TODO: mention mobile support here? (alpha Android app / mobile web view) -->

</div>
