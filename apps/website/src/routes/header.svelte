<script>
    import DownloadNow from "./download-now.svelte";

</script>
<header class="header bg-white dark:bg-gray-900 sticky dark:text-white top-0 z-50 shadow">
    <div class="container mx-auto flex items-center py-4">
        <a href="/" class="flex items-center gap-x-2 w-100">
            <img src="icon-color.svg" alt="Trilium Notes Logo" class="w-12 h-12">
            <span class="text-2xl">Trilium Notes</span>
        </a>

        <div class="group w-full">
            <nav class="header-nav">
                <ul class="flex items-center justify-end gap-4">
                    <li><a href="/">User Guide</a></li>
                    <li><a href="/">Technical Guide</a></li>
                    <li><a href="/" class="text-violet-500">Support us</a></li>
                    <li><DownloadNow /></li>
                </ul>                
            </nav>
        </div>
    </div>
</header>