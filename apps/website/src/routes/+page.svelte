<script>
    import DownloadNow from "./download-now.svelte";
</script>

<section class="relative overflow-hidden bg-gradient-to-br from-white to-violet-50">
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
                <h2 class="text-4xl font-bold mb-4 text-gray-900">Organize Your Thoughts.<br/> Build Your Knowledge.</h2>
                <p class="text-lg mb-6 text-gray-700">
                    Trilium Notes helps you build and organize complex personal knowledge bases effortlessly.  
                    Its unique tree structure, rich editing tools, and powerful search features make managing your information intuitive and flexible.
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
        <!-- Canvas Notes -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <img src="/note-types/canvas.png" alt="Canvas Note Screenshot" class="w-full h-56 object-cover object-top">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Canvas Notes</h3>
                <p class="text-gray-600">Draw and arrange elements freely using an Excalidraw-powered canvas — ideal for diagrams, sketches, and visual planning.</p>
            </div>
        </div>

        <!-- Mermaid Diagrams -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <img src="/note-types/mermaid.png" alt="Mermaid Diagram Screenshot" class="w-full h-56 object-cover object-top">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Mermaid Diagrams</h3>
                <p class="text-gray-600">Render flowcharts, Gantt charts, and sequence diagrams with Mermaid markdown syntax directly in your notes.</p>
            </div>
        </div>

        <!-- Geo Maps -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <img src="/note-types/geo-map.png" alt="Geo Map Screenshot" class="w-full h-56 object-cover">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Geo Maps</h3>
                <p class="text-gray-600">Plot locations and GPX tracks to visualize geography-linked notes and movement patterns on interactive maps.</p>
            </div>
        </div>

        <!-- Mind Maps -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <img src="/note-types/mind-map.png" alt="Mind Map Screenshot" class="w-full h-56 object-cover">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Mind Maps</h3>
                <p class="text-gray-600">Organize ideas visually using a drag-and-drop mind map editor powered by Mind Elixir.</p>
            </div>
        </div>
    </div>
</section>

<section class="mt-20 max-w-6xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Feature Highlights</h2>

    <div class="grid gap-12 md:grid-cols-2 max-w-4xl mx-auto text-gray-700">
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
                <li>Synchronization with self-hosted and third-party servers.</li>
                <li>Strong note encryption with per-note granularity.</li>
                <li>Sharing notes publicly on the internet.</li>
            </ul>
        </div>

        <!-- Advanced & Customization -->
        <div>
            <h3 class="flex items-center text-xl font-semibold mb-6 text-violet-700">Advanced & Customization</h3>
            <ul class="list-disc list-inside space-y-3">
                <li>Relation maps and link maps to visualize notes.</li>
                <li>Scripting support and REST API for automation.</li>
                <li>Touch-optimized mobile frontend and dark/user themes.</li>
                <li>Customizable UI with sidebar buttons and user widgets.</li>
                <li>Metrics with Grafana dashboard integration.</li>
                <li>Scales efficiently beyond 100,000 notes.</li>
            </ul>
        </div>
    </div>
</section>


<section class="bg-violet-50 py-16 mt-24">
    <div class="container mx-auto text-center px-4">
        <h2 class="text-3xl font-bold mb-4">Ready to get started with Trilium Notes?</h2>
        <p class="text-lg text-gray-700 mb-8">Build your personal knowledge base with powerful features and full privacy.</p>

        <div class="flex justify-center gap-6">
            <a href="#" class="py-3 px-6 bg-violet-600 text-white font-semibold rounded-full shadow hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75">
                Download Now
            </a>
        </div>
    </div>
</section>