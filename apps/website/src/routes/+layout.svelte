<script lang="ts">
	import '../app.css';
    import Header from './header.svelte';
	
	let { children } = $props();
</script>

<Header />

<main>
{@render children()}
</main>

<footer class="container max-w-screen mx-0 w-full bg-white dark:bg-gray-900 mt-2 py-6 text-sm text-center text-gray-500">
    &copy; 2024-2025 <a href="https://github.com/eliandoran" class="text-blue-500 hover:underline">Elian Doran</a> and the <a href="https://github.com/TriliumNext/Notes/graphs/contributors" class="text-blue-500 hover:underline">team</a>. <br/>    &copy; 2017-2024 <a href="https://github.com/zadam" class="text-blue-500 hover:underline">Adam Zivner</a>.
</footer>
