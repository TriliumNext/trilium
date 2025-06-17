<script>
    import DownloadNow from "./download-now.svelte";
    import FeatureBlock from "./feature-block.svelte";
</script>

<svelte:head>
    <title>Trilium Notes</title>
    <!-- TODO: description?
    	<meta name="description" content="This is where the description goes for search engines" />
    -->
</svelte:head>

<section class="relative overflow-hidden bg-gradient-to-br from-white dark:from-black to-violet-50 dark:to-violet-900">
    <!-- Bokeh background circles -->
    <div class="absolute inset-0 pointer-events-none z-0">
        <div class="absolute w-72 h-72 bg-violet-300 opacity-30 rounded-full blur-3xl top-[-50px] left-[-80px]"></div>
        <div class="absolute w-96 h-96 bg-pink-200 opacity-20 rounded-full blur-3xl bottom-[-100px] right-[-60px]"></div>
        <div class="absolute w-64 h-64 bg-indigo-200 opacity-20 rounded-full blur-2xl top-[200px] left-[50%] transform -translate-x-1/2"></div>
    </div>

    <div class="relative z-10 container mx-auto pt-24 pb-24 px-4">
        <div class="flex flex-col md:flex-row items-center md:justify-between gap-12">

            <!-- Left: Text Content -->
            <div class="md:w-1/3">
                <h2 class="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Organize Your Thoughts.<br/> Build Your Knowledge.</h2>
                <p class="text-lg mb-6 text-gray-700 dark:text-gray-300">
                    Trilium Notes helps you build and organize complex personal knowledge bases effortlessly.  
                    Its unique tree structure, rich editing tools, and powerful search features make managing your information intuitive and flexible.
                    <!-- TODO: remove the squiggly autocorrect lines in the screenshot!! -->
                    <!-- TODO: dark mode screenshot -->
                </p>
                <div class="flex items-center gap-6">
                    <DownloadNow big />                    
                    <a href="/download" class="font-medium text-violet-700 hover:underline">
                        More platforms
                    </a>
                </div>
            </div>

            <!-- Right: Screenshot -->
            <div class="md:w-2/3">
                <img src="screenshots/desktop-win.png" alt="Screenshot of the app on desktop Windows" class="w-full rounded-xl shadow-lg">
            </div>
        </div>
    </div>
</section>

<section class="mt-20 max-w-6xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Beyond Text: Smarter Note Types</h2>

    <div class="grid md:grid-cols-2 gap-10">
        <FeatureBlock
            imgSrc="/note-types/canvas.png"
            imgAlt="Canvas Note Screenshot"
            title="Canvas Notes"
            text="Draw and arrange elements freely using an Excalidraw-powered canvas — ideal for diagrams, sketches, and visual planning."
            />

        <FeatureBlock
            imgSrc="/note-types/mermaid.png"
            imgAlt="Mermaid Diagram Screenshot"
            title="Mermaid Diagrams"
            text="Render flowcharts, Gantt charts, and sequence diagrams with Mermaid markdown syntax directly in your notes."
            />

        <FeatureBlock
            imgSrc="/note-types/geo-map.png"
            imgAlt="Geo Map Screenshot"
            title="Geo Maps"
            text="Plot locations and GPX tracks to visualize geography-linked notes and movement patterns on interactive maps."
            />

        <FeatureBlock
            imgSrc="/note-types/mind-map.png"
            imgAlt="Mind Map Screenshot"
            title="Mind Maps"
            text="Organize ideas visually using a drag-and-drop mind map editor powered by Mind Elixir."
            />
    </div>

    <h2 class="text-3xl font-bold text-center mb-12">Technical Features</h2>

    <div class="grid md:grid-cols-2 gap-10">
        <FeatureBlock
            imgSrc="/technical-features/sync-server.png"
            imgAlt="TODO"
            title="Synchronization Server"
            text="Seamless mirroring of changes acroll all devices."
            />

        <FeatureBlock
            imgSrc="/technical-features/cross-platform.png"
            imgAlt="TODO, maybe some icons"
            title="Cross-platform App + Web UI"
            text="Use as Electron application or in your browser."
            />

        <FeatureBlock
            imgSrc="/technical-features/scripting.png"
            imgAlt="TODO"
            title="Scripting"
            text="Custom UI widgets and a REST API for automation."
            />

        <FeatureBlock
            imgSrc="/technical-features/grafana-metrics.png"
            imgAlt="Mind Map Screenshot"
            title="Grafana Metrics"
            text="Measure database metrics over time."
            />
    </div>
</section>

<section class="mt-20 max-w-6xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Feature Highlights</h2>

    <div class="grid gap-12 md:grid-cols-2 max-w-4xl mx-auto text-gray-700 dark:text-gray-300">
        <!-- Organization & Navigation -->
        <div>
            <h3 class="flex items-center text-xl font-semibold mb-6 text-violet-700">Organization & Navigation</h3>
            <ul class="list-disc list-inside space-y-3">
                <li>Arbitrarily deep note tree with cloning support.</li>
                <li>Fast navigation, full-text search, and note hoisting.</li>
                <li>Note attributes for organization, querying, and scripting.</li>
                <li>Seamless note versioning.</li>
            </ul>
        </div>

        <!-- Editing & Content -->
        <div>
            <h3 class="flex items-center text-xl font-semibold mb-6 text-violet-700">Editing & Content</h3>
            <ul class="list-disc list-inside space-y-3">
                <li>Rich WYSIWYG editor with tables, images, math, and markdown autoformat.</li>
                <li>Source code editing with syntax highlighting.</li>
                <li>Evernote and Markdown import/export.</li>
                <li>Web Clipper for easy saving of web content.</li>
            </ul>
        </div>

        <!-- Security & Sync -->
        <div>
            <h3 class="flex items-center text-xl font-semibold mb-6 text-violet-700">Security & Sync</h3>
            <ul class="list-disc list-inside space-y-3">
                <li>Direct OpenID and TOTP integration for secure login.</li>
                <li>Strong note encryption with per-note granularity.</li>
                <li>Sharing notes publicly on the internet.</li>
            </ul>
        </div>

        <!-- Advanced & Customization -->
        <div>
            <h3 class="flex items-center text-xl font-semibold mb-6 text-violet-700">Advanced & Customization</h3>
            <ul class="list-disc list-inside space-y-3">
                <li>Relation maps and link maps to visualize notes.</li>
                <li>Touch-optimized mobile frontend and dark/user themes.</li>
                <li>Customizable UI with sidebar buttons and user widgets.</li>
                <li>Scales efficiently beyond 100,000 notes.</li>
            </ul>
        </div>
    </div>
</section>


<section class="bg-violet-50 dark:bg-black py-16 mt-24">
    <div class="container mx-auto text-center px-4">
        <h2 class="text-3xl font-bold mb-4">Ready to get started with Trilium Notes?</h2>
        <p class="text-lg text-gray-700 dark:text-gray-200 mb-8">Build your personal knowledge base with powerful features and full privacy.</p>

        <div class="flex justify-center gap-6">
            <a href="download" class="py-3 px-6 bg-violet-600 text-white font-semibold rounded-full shadow hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75">
                Download Now
            </a>
        </div>
    </div>
</section>